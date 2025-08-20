import {DestroyRef, inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {NetworkService} from '../services/network.service';

const API_BASE_URL = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=`;

@Injectable({providedIn: 'root'})
export class BitcoinStore {

  // State signals.
  private readonly _priceEur = signal<number>(0);
  // Public readonly signals
  public readonly priceEur = this._priceEur.asReadonly();
  private readonly _priceUsd = signal<number>(0);
  public readonly priceUsd = this._priceUsd.asReadonly();
  private readonly _lastUpdatedPriceEur = signal<number>(0);
  public readonly lastUpdatedPriceEur = this._lastUpdatedPriceEur.asReadonly();
  private readonly _lastUpdatedPriceUsd = signal<number>(0);
  public readonly lastUpdatedPriceUsd = this._lastUpdatedPriceUsd.asReadonly();
  private readonly _loadingPriceEur = signal<boolean>(false);
  public readonly loadingPriceEur = this._loadingPriceEur.asReadonly();
  private readonly _loadingPriceUsd = signal<boolean>(false);
  public readonly loadingPriceUsd = this._loadingPriceUsd.asReadonly();
  private readonly _errorPriceEur = signal<string | undefined>(undefined);
  public readonly errorPriceEur = this._errorPriceEur.asReadonly();
  private readonly _errorPriceUsd = signal<string | undefined>(undefined);
  public readonly errorPriceUsd = this._errorPriceUsd.asReadonly();

  private destroyRef = inject(DestroyRef);
  private http: HttpClient = inject(HttpClient);
  private networkService: NetworkService = inject(NetworkService);

  constructor() {
    // Initial fetch and start polling each minute for both currencies.
    void this.loadEur();
    void this.loadUsd();
    const id = setInterval(() => {
      void this.loadEur();
      void this.loadUsd();
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
        this._errorPriceEur.set('Empty response from price API');
        return;
      }
      // Expecting shape: { bitcoin: { eur|usd: number } }
      const value = data?.bitcoin?.eur;
      if (typeof value !== 'number') {
        this._errorPriceEur.set('Invalid response from price API');
        return;
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
        this._errorPriceUsd.set('Empty response from price API');
        return;
      }
      // Expecting shape: { bitcoin: { eur|usd: number } }
      const value = data?.bitcoin?.usd;
      if (typeof value !== 'number') {
        this._errorPriceEur.set('Invalid response from price API');
        return;
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
