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
  readonly amount = signal<number | null>(1);
  readonly currency = signal<'eur' | 'usd'>('eur');
  readonly direction = signal<'btc-to-fiat' | 'fiat-to-btc'>('btc-to-fiat');

  // Make the public BitcoinStore signals available to the template.
  readonly bitcoinStore = inject(BitcoinStore);
}
