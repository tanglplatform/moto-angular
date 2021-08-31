import { Component, OnInit } from '@angular/core';
import { WalletService } from 'src/app/Services/BlockchainServices/wallet.service';
import { SubscriptionsManagerService } from 'src/app/Services/subscriptions-manager.service';
import { Account, Tier } from 'src/declaration';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { MatDialog } from '@angular/material/dialog';
import { CreateTierDialogComponent } from '../create-tier-dialog/create-tier-dialog.component';
import { ProfileService } from 'src/app/Services/profile.service';
@Component({
  selector: 'app-create-tiers',
  templateUrl: './create-tiers.component.html',
  styleUrls: ['./create-tiers.component.css']
})
export class CreateTiersComponent implements OnInit {
  account: Account | null = null;
  add: any = faPlus;
  tiers: Tier[] | null = null;
  constructor(private _subscriptions: SubscriptionsManagerService,
    private _wallet: WalletService, private matDialog: MatDialog,
  private _profile:ProfileService) { }

  ngOnInit(): void {
    this._wallet.getAccount()
      .subscribe((account) => {
        if (account) {
          this.account = account;
          this._getTiers(account);
        }
      });
    this._getTiers();
  }

  manageTier(tier?: Tier) {
    if (tier) {
      this._subscriptions.setTier(tier);
    }
    this.matDialog.open(CreateTierDialogComponent, { height: "auto", width: "410px" })
  }

  changeActiveTier(tier: Tier) { }

  invalidateTier(tier: Tier) { }

  private _getTiers(account?: Account) {
    //talk to sub manager
    this._subscriptions.getTiers()
      .then((tiers) => {
        if (tiers) {
          this.tiers = tiers;
        }
      })
      .catch((err) => {
        this._profile.openSnackBar(err.message);
      });
  }




}
