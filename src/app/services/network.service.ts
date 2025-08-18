import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable({providedIn: 'root'})
export class NetworkService {

  /**
   * Converts an unknown error object into a string error message.
   *
   * @param {unknown} error - The error object to be converted into a message.
   * @return {string} A string representation of the error message.
   */
  toErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'Network error';
      if (error.status === 404) return 'Not found 404';
      if (error.status === 429) return 'Too many requests';
      if (error.status >= 500) return 'Server error';
      return error.message || `Request failed ${error.status}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      return String(error.message);
    }
    return String(error);
  }


}
