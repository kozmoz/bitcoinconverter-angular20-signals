import {DestroyRef, inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {NetworkService} from '../services/network.service';

const API_BASE_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur,usd';

type Price = { eur: number, usd: number, last_updated: number };

type ApiResponse = { bitcoin?: { eur?: number; usd?: number } };

@Injectable({providedIn: 'root'})
export class BitcoinStore {

  // State signals.
  private readonly _price = signal<Price | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  public readonly price = this._price.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  private http: HttpClient = inject(HttpClient);
  private networkService: NetworkService = inject(NetworkService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Initial fetch and start polling each minute for both currencies.
    void this.loadPrice();
    const intervalId = setInterval(() => {
      void this.loadPrice();
    }, 60_000);

    // Cleanup on destroy.
    this.destroyRef.onDestroy(() => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    });
  }

  /**
   * Fetches the current Bitcoin price in the EUR and USD currency and updates the relevant state.
   *
   * @return A promise that resolves when the operation is complete.
   */
  async loadPrice(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    try {
      // Fetch both currencies in parallel.
      const data = await firstValueFrom(this.http.get<ApiResponse>(API_BASE_URL));
      if (!data) {
        this._error.set('Empty response from price API');
        return;
      }

      // Expecting shape: { bitcoin: { eur: number, usd: number } }
      const {eur, usd} = data.bitcoin ?? {};
      if (typeof eur !== 'number' || typeof usd !== 'number') {
        this._error.set('Invalid response from price API');
        return;
      }
      const last_updated = Date.now();
      this._price.set({eur, usd, last_updated});
      this._error.set(null);

    } catch (error) {
      this._error.set(this.networkService.toErrorMessage(error) ?? 'Failed to fetch EUR price');
    } finally {
      this._loading.set(false);
    }
  }
}
