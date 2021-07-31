import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
const config = require("../../../app.config");
const WAValidator = require('crypto-wallet-address-validator');
const secondaryValidator = require("wallet-address-validator");

declare let window: any;

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  public accountObservable: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public account: any | null = null;
  private _walletInterface: any;
  public networkObservable: BehaviorSubject<number | null> = new BehaviorSubject<number | null>(null);
  public chainId: number | null = null;

  constructor() {
  }

  initWallet(): Observable<string | null>{
    this._getWalletInterface();
    return this.accountObservable;
  }

  hasBrowserProvider(): boolean {
    return (window.ethereum) ? true : false;
  }

  /**
   * if no account sends a request to an inteface to get an account
   * @returns observabe
   */
  getAccount(): Observable<string | null> {
    if (!this.account) {
      this.initWallet();
    }
    return this.accountObservable;
  }

  /**
   * does not request an intefface
   * @returns observabe 
   */
  listenForAccount(): Observable<string | null>{
    return this.accountObservable;
  }

  getNetwork(): Observable<number | null> {
    return this.networkObservable;
  }

  sendTransaction(transaction: any): Promise<any> {
    console.table(transaction);

    return this._walletInterface.request({
      method: 'eth_sendTransaction',
      params: [transaction],
    });
  }

  convertToDecimalPrice(amount: string, currency: string) {
    //to do
  }

  isValidBTCaddress(address: string, network: string): boolean {
    return WAValidator.validate(address, network);
  }

  isValidAddress(address: string, network: string): boolean {
    return secondaryValidator.validate(address, network);
  }

  async signForNFT(nft: any): Promise<any> {
    if (this.account) {
      return new Promise((resolve, reject) => {
        console.log("this.account ", this.account);
        resolve(this.executeSignature(this.account, nft));

      });
    }
    else {
      return new Promise((resolve, reject) => {
        reject(new Error("NoAccountFound"));
      });
    }
  }

  private _getWalletInterface() {
    //do a popup later so they can decide between ethereum
    if (window.ethereum) {
      this._walletInterface = window.ethereum;//typify this.
      this._requestAccount();
      this._walletInterface.on('chainChanged', (chainId: any) => {
        console.log("network id ", parseInt(chainId, 16));
        this.networkObservable.next(parseInt(chainId, 16));
      });
    }
  }

  private _requestAccount(): void {
    this._walletInterface.request({ method: 'eth_requestAccounts' })
      .then((accounts: string[]) => {
        this.account = accounts[0];
        console.log("account observable is about to send ", this.account);
        this.accountObservable.next(this.account);
        this.chainId = this._walletInterface.networkVersion;
        this.networkObservable.next(this._walletInterface.networkVersion);
      })
      .catch((err: any) => {
        console.log("WalletService:_requestionBrowserAccount", err);
      });
  }

  private executeSignature(account: string, nft: any): Promise<any> {
    let parameters = [account, this.prepareSignatureData(nft)];
    return this._walletInterface.request({ method: "eth_signTypedData_v4", params: parameters })
      .then((result: any) => {
        if (result) {
          return result;
        }
        else {
          return new Error("no signature");
        }
      })
      .catch((err: any) => {
        return new Error("signature error");
      });

  }

  private prepareSignatureData(nft: any) {
    console.log("preparing signature ", config.network[nft.chainId]);
    let domain = config.network[nft.chainId].contracts.nft.domain;
    let data = {
      "types": {
        "EIP712Domain": [
          { "name": "name", "type": "string" },
          { "name": "version", "type": "string" },
          { "name": "verifyingContract", "type": "address" },
          { "name": "chainId", "type": "uint256" }
        ],
        "NFT": [
          { "name": "name", "type": "string" },
          { "name": "chainId", "type": "uint256" },
          { "name": "owner", "type": "address" },
          { "name": "contentHash", "type": "bytes32" },
          { "name": "tokenId", "type": "uint256" }
        ]
      },
      "primaryType": "NFT",
      "domain": domain,
      "message": nft
    };
    console.log("signature data prepared ", data);
    return JSON.stringify(data);
  }
}
