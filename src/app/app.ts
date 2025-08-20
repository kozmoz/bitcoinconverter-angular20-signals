import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {BitcoinStore} from './stores/bitcoin.store';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html'
})
export class App {

  // The amount will be null in case of empty or invalid input.
  amount = signal<number | null>(1);
  currency = signal<'eur' | 'usd'>('eur');
  direction = signal<'btc-to-fiat' | 'fiat-to-btc'>('btc-to-fiat');

  private bitcoinStore = inject(BitcoinStore);

  priceEur = this.bitcoinStore.priceEur;
  priceUsd = this.bitcoinStore.priceUsd;

  lastUpdatedEur = this.bitcoinStore.lastUpdatedPriceEur;
  lastUpdatedUsd = this.bitcoinStore.lastUpdatedPriceUsd;

  loadingPriceEur = this.bitcoinStore.loadingPriceEur;
  loadingPriceUsd = this.bitcoinStore.loadingPriceUsd;

  errorEur = this.bitcoinStore.errorPriceEur;
  errorUsd = this.bitcoinStore.errorPriceUsd;

}
