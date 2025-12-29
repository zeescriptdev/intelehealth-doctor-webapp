import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NcdReportService {
  // Use mindmapURL for backend API (port 3004)
  // This points to the backend service where the NCD report API is hosted
  private baseURL = environment.mindmapURL;

  constructor(private http: HttpClient) { }

  /**
   * Get NCD report data by patient UUID
   * @param {string} patientUuid - Patient UUID
   * @return {Observable<any>}
   */
  getNcdReportData(patientUuid: string): Observable<any> {
    const url = `${this.baseURL}/ncdReport/r/${patientUuid}`;
    return this.http.get(url);
  }
}

