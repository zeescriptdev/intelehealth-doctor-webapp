import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NcdReportService } from '../services/ncd-report.service';
import { environment } from '../../environments/environment';

interface NcdReportData {
  success: boolean;
  data?: {
    patient: {
      uuid: string;
      name: string;
      identifier: string;
      age: number;
      gender: string;
    };
    visits: Array<{
      date: string;
      bp: string;
      hgb: string | number;
      rbs: string | number;
    }>;
  };
  message?: string;
}

@Component({
  selector: 'app-ncd-report',
  templateUrl: './ncd-report.component.html',
  styleUrls: ['./ncd-report.component.scss']
})
export class NcdReportComponent implements OnInit, OnDestroy {
  patientUuid: string;
  loading = true;
  error: string = null;
  reportData: NcdReportData['data'] = null;
  baseURL = environment.baseURL;
  

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ncdReportService: NcdReportService
  ) { }

  ngOnInit(): void {
    // Get patient UUID from route params
    this.patientUuid = this.route.snapshot.paramMap.get('patientUuid');
    console.log('NCD Report - Patient UUID from route:', this.patientUuid);
    
    if (!this.patientUuid) {
      console.error('NCD Report - Patient UUID not found in URL');
      this.error = 'Patient UUID not found in URL';
      this.loading = false;
      return;
    }

    this.loadNcdReport();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Load NCD report data from backend
   */
  loadNcdReport(): void {
    this.loading = true;
    this.error = null;

    this.ncdReportService.getNcdReportData(this.patientUuid).subscribe({
      next: (response: NcdReportData) => {
        if (response.success && response.data) {
          this.reportData = response.data;
          if (this.reportData.visits && this.reportData.visits.length > 0) {
            console.log('NCD Report - First visit sample:', this.reportData.visits[0]);
          }
        } else {
          console.error('NCD Report - Response not successful:', response);
          this.error = response.message || 'Failed to load report';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('NCD Report - Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          url: err.url
        });
        this.error = err.error?.message || err.message || 'Failed to load report. Please try again.';
        this.loading = false;
      }
    });
  }


  /**
   * Determine if BP is high (for color coding)
   */
  isHighBP(bp: string): boolean {
    if (!bp || bp === 'N/A') return false;
    const parts = bp.split('/');
    if (parts.length === 2) {
      const systolic = parseFloat(parts[0]);
      const diastolic = parseFloat(parts[1]);
      if (!isNaN(systolic) && !isNaN(diastolic)) {
        return systolic >= 140 || diastolic >= 90;
      }
    }
    return false;
  }

  /**
   * Determine if HB is high (for color coding)
   */
  isHighHB(hgb: string | number): boolean {
    if (hgb === null || hgb === undefined || hgb === 'N/A') return false;
    const hgbNum = parseFloat(hgb.toString());
    return !isNaN(hgbNum) && hgbNum > 18;
  }

  /**
   * Determine if HB is normal (for color coding)
   */
  isNormalHB(hgb: string | number): boolean {
    if (hgb === null || hgb === undefined || hgb === 'N/A') return false;
    const hgbNum = parseFloat(hgb.toString());
    return !isNaN(hgbNum) && hgbNum >= 12 && hgbNum <= 18;
  }

  /**
   * Determine if RBS is high (for color coding)
   */
  isHighRBS(rbs: string | number): boolean {
    if (rbs === null || rbs === undefined || rbs === 'N/A') return false;
    const rbsNum = parseFloat(rbs.toString());
    return !isNaN(rbsNum) && rbsNum > 140;
  }

  /**
   * Determine if RBS is normal (for color coding)
   */
  isNormalRBS(rbs: string | number): boolean {
    if (rbs === null || rbs === undefined || rbs === 'N/A') return false;
    const rbsNum = parseFloat(rbs.toString());
    return !isNaN(rbsNum) && rbsNum >= 70 && rbsNum <= 140;
  }

  /**
   * Get color for BP value
   */
  getBPColor(bp: string): string {
    return this.isHighBP(bp) ? '#dc3545' : (bp !== 'N/A' ? '#28a745' : '#000');
  }

  /**
   * Get color for HB value
   */
  getHBColor(hgb: string | number): string {
    if (hgb === null || hgb === undefined || hgb === 'N/A') return '#000';
    return this.isHighHB(hgb) ? '#dc3545' : (this.isNormalHB(hgb) ? '#28a745' : '#dc3545');
  }

  /**
   * Get color for RBS value
   */
  getRBSColor(rbs: string | number): string {
    if (rbs === null || rbs === undefined || rbs === 'N/A') return '#000';
    return this.isHighRBS(rbs) ? '#dc3545' : (this.isNormalRBS(rbs) ? '#28a745' : '#dc3545');
  }

}

