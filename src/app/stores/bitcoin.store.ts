// noinspection ExceptionCaughtLocallyJS,JSIgnoredPromiseFromCall

import {DestroyRef, inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {NetworkService} from '../services/network.service';

const API_BASE_URL = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=`;

@Injectable({providedIn: 'root'})
export class BitcoinStore {

  // State signals.
  priceEur = signal<number>(0);
  priceUsd = signal<number>(0);
  lastUpdatedPriceEur = signal<number>(0);
  lastUpdatedPriceUsd = signal<number>(0);
  loadingPriceEur = signal<boolean>(false);
  loadingPriceUsd = signal<boolean>(false);
  errorPriceEur = signal<string | undefined>(undefined);
  errorPriceUsd = signal<string | undefined>(undefined);

  private destroyRef = inject(DestroyRef);
  private http: HttpClient = inject(HttpClient);
  private networkService: NetworkService = inject(NetworkService);

  constructor() {
    // Initial fetch and start polling each minute for both currencies.
    this.loadEur();
    this.loadUsd();
    const id = setInterval(() => {
      this.loadEur();
      this.loadUsd();
    }, 60_000);

    // Cleanup interval on component destroy.
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  /**
   * Fetches the current Bitcoin price in the EUR currency and updates the relevant state.
   *
   * @return A promise that resolves when the operation is complete.
   */
  async loadEur(): Promise<void> {
    const url = `${API_BASE_URL}eur`;
    this.loadingPriceEur.set(true);
    this.errorPriceEur.set(undefined);
    try {
      const data = await firstValueFrom(this.http.get<any>(url))
      if (!data) {
        throw Error('Empty response from price API');
      }
      // Expecting shape: { bitcoin: { eur|usd: number } }
      const value = data?.bitcoin?.eur;
      if (typeof value !== 'number') {
        throw Error('Invalid response from price API');
      }
      this.priceEur.set(value);
      this.lastUpdatedPriceEur.set(Date.now());
      this.errorPriceEur.set(undefined);

    } catch (error) {
      this.errorPriceEur.set(this.networkService.toErrorMessage(error) ?? 'Failed to fetch EUR price');
    } finally {
      this.loadingPriceEur.set(false);
    }
  }

  /**
   * Fetches the current Bitcoin price in the USD currency and updates the relevant state.
   *
   * @return A promise that resolves when the operation is complete.
   */
  async loadUsd(): Promise<void> {
    const url = `${API_BASE_URL}usd`;
    this.loadingPriceUsd.set(true);
    this.errorPriceUsd.set(undefined);
    try {
      const data = await firstValueFrom(this.http.get<any>(url))
      if (!data) {
        throw Error('Empty response from price API');
      }
      // Expecting shape: { bitcoin: { eur|usd: number } }
      const value = data?.bitcoin?.usd;
      if (typeof value !== 'number') {
        throw Error('Invalid response from price API');
      }
      this.priceUsd.set(value);
      this.lastUpdatedPriceUsd.set(Date.now());
      this.errorPriceUsd.set(undefined);

    } catch (error) {
      this.errorPriceUsd.set(this.networkService.toErrorMessage(error) ?? 'Failed to fetch USD price');
    } finally {
      this.loadingPriceUsd.set(false);
    }
  }
}
