import {inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {NetworkService} from '../services/network.service';

const API_BASE_URL = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=`;

type Price = { eur: number, usd: number, last_updated: number };

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

  constructor() {
    // Initial fetch and start polling each minute for both currencies.
    void this.loadPrice();
    setInterval(() => {
      void this.loadPrice();
    }, 60_000);
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
      const [dataEur, dataUsd] = await Promise.all([
        firstValueFrom(this.http.get<any>(`${API_BASE_URL}eur`)),
        firstValueFrom(this.http.get<any>(`${API_BASE_URL}usd`))
      ]);
      if (!dataEur || !dataUsd) {
        this._error.set('Empty response from price API');
        return;
      }
      // Expecting shape: { bitcoin: { eur|usd: number } }
      const valueEur = dataEur?.bitcoin?.eur;
      const valueUsd = dataEur?.bitcoin?.usd;
      if (typeof valueEur !== 'number' || typeof valueUsd !== 'number') {
        this._error.set('Invalid response from price API');
        return;
      }
      this._price.set({eur: valueEur, usd: valueUsd, last_updated: Date.now()});
      this._error.set(null);

    } catch (error) {
      this._error.set(this.networkService.toErrorMessage(error) ?? 'Failed to fetch EUR price');
    } finally {
      this._loading.set(false);
    }
  }
}
