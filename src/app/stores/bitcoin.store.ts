// noinspection ExceptionCaughtLocallyJS,JSIgnoredPromiseFromCall

import {DestroyRef, inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {NetworkService} from '../services/network.service';

const API_BASE_URL = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=`;

@Injectable({providedIn: 'root'})
export class BitcoinStore {

  // State signals.
  private _priceEur = signal<number>(0);
  private _priceUsd = signal<number>(0);
  private _lastUpdatedPriceEur = signal<number>(0);
  private _lastUpdatedPriceUsd = signal<number>(0);
  private _loadingPriceEur = signal<boolean>(false);
  private _loadingPriceUsd = signal<boolean>(false);
  private _errorPriceEur = signal<string | undefined>(undefined);
  private _errorPriceUsd = signal<string | undefined>(undefined);

  // Public readonly signals
  public readonly priceEur = this._priceEur.asReadonly();
  public readonly priceUsd = this._priceUsd.asReadonly();
  public readonly lastUpdatedPriceEur = this._lastUpdatedPriceEur.asReadonly();
  public readonly lastUpdatedPriceUsd = this._lastUpdatedPriceUsd.asReadonly();
  public readonly loadingPriceEur = this._loadingPriceEur.asReadonly();
  public readonly loadingPriceUsd = this._loadingPriceUsd.asReadonly();
  public readonly errorPriceEur = this._errorPriceEur.asReadonly();
  public readonly errorPriceUsd = this._errorPriceUsd.asReadonly();

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
    this._loadingPriceEur.set(true);
    this._errorPriceEur.set(undefined);
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
      this._priceEur.set(value);
      this._lastUpdatedPriceEur.set(Date.now());
      this._errorPriceEur.set(undefined);

    } catch (error) {
      this._errorPriceEur.set(this.networkService.toErrorMessage(error) ?? 'Failed to fetch EUR price');
    } finally {
      this._loadingPriceEur.set(false);
    }
  }

  /**
   * Fetches the current Bitcoin price in the USD currency and updates the relevant state.
   *
   * @return A promise that resolves when the operation is complete.
   */
  async loadUsd(): Promise<void> {
    const url = `${API_BASE_URL}usd`;
    this._loadingPriceUsd.set(true);
    this._errorPriceUsd.set(undefined);
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
      this._priceUsd.set(value);
      this._lastUpdatedPriceUsd.set(Date.now());
      this._errorPriceUsd.set(undefined);

    } catch (error) {
      this._errorPriceUsd.set(this.networkService.toErrorMessage(error) ?? 'Failed to fetch USD price');
    } finally {
      this._loadingPriceUsd.set(false);
    }
  }
}
