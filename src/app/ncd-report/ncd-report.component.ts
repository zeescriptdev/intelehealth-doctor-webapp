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
   * Get systolic color based on ranges
   * 90-119: Green (#008000)
   * 120-139: Yellow (#d9d900)
   * Default: Red (#FF0000)
   */
  getSystolicColor(systolic: number): string {
    if (systolic >= 90 && systolic <= 119) {
      return '#008000'; // Green
    } else if (systolic >= 120 && systolic <= 139) {
      return '#d9d900'; // Yellow
    }
    return '#FF0000'; // Red - Default
  }

  /**
   * Get diastolic color based on ranges
   * <80: Green (#008000)
   * 80-99: Yellow (#d9d900)
   * Default: Red (#FF0000)
   */
  getDiastolicColor(diastolic: number): string {
    if (diastolic < 80) {
      return '#008000'; // Green
    } else if (diastolic >= 80 && diastolic <= 99) {
      return '#d9d900'; // Yellow
    }
    return '#FF0000'; // Red - Default
  }

  /**
   * Parse BP string and return systolic/diastolic values
   */
  parseBP(bp: string): { systolic: number | null, diastolic: number | null, sysText: string, diaText: string } {
    if (!bp || bp === 'N/A') {
      return { systolic: null, diastolic: null, sysText: 'N/A', diaText: '' };
    }

    const parts = bp.split('/');
    if (parts.length === 2) {
      const sysText = parts[0].trim();
      const diaText = parts[1].trim();
      const systolic = parseFloat(sysText);
      const diastolic = parseFloat(diaText);

      if (!isNaN(systolic) && !isNaN(diastolic)) {
        return { systolic, diastolic, sysText, diaText };
      }
    }

    return { systolic: null, diastolic: null, sysText: bp, diaText: '' };
  }

  /**
   * Get color for entire BP value (fallback for simple display)
   */
  getBPColor(bp: string): string {
    const parsed = this.parseBP(bp);
    if (parsed.systolic === null || parsed.diastolic === null) {
      return '#6c757d'; // Gray for N/A
    }
    // Return systolic color as primary color
    return this.getSystolicColor(parsed.systolic);
  }

  /**
   * Get color for HB value based on ranges and gender
   * Normal: ≥13 (M), ≥12 (F) - Green
   * Mild: 11.0-12.9 (M), 11.0-11.9 (F) - Yellow
   * Moderate: 8.0-10.9 (M/F) - Orange
   * Severe: <8 - Red
   */
  getHBColor(hgb: string | number): string {
    if (hgb === null || hgb === undefined || hgb === 'N/A') return '#837c85';

    const hgbNum = parseFloat(hgb.toString());
    if (isNaN(hgbNum)) return '#837c85';

    // Determine if patient is male or female (from reportData)
    const isMale = this.reportData?.patient?.gender?.toLowerCase() === 'male' ||
                   this.reportData?.patient?.gender?.toLowerCase() === 'm';

    // Severe - Red
    if (hgbNum < 8) {
      return '#dc3545'; // Red
    }
    // Moderate - Orange
    if (hgbNum >= 8 && hgbNum <= 10.9) {
      return '#ff8c00'; // Orange
    }
    // Mild - Yellow
    if (isMale) {
      if (hgbNum >= 11.0 && hgbNum <= 12.9) {
        return '#ffc107'; // Yellow
      }
    } else {
      if (hgbNum >= 11.0 && hgbNum <= 11.9) {
        return '#ffc107'; // Yellow
      }
    }
    // Normal - Green
    if (isMale) {
      if (hgbNum >= 13) {
        return '#28a745'; // Green
      }
    } else {
      if (hgbNum >= 12) {
        return '#28a745'; // Green
      }
    }

    return '#000';
  }

  /**
   * Get color for RBS value based on ranges
   * Hypoglycemia: <70 - Red
   * Normal: 70-139 - Green
   * Pre-Diabetes: 140-199 - Yellow
   * Suspected Diabetes: ≥200 - Orange
   */
  getRBSColor(rbs: string | number): string {
    if (rbs === null || rbs === undefined || rbs === 'N/A') return '#837c85';

    const rbsNum = parseFloat(rbs.toString());
    if (isNaN(rbsNum)) return '#837c85';

    // Hypoglycemia - Red
    if (rbsNum < 70) {
      return '#dc3545'; // Red
    }
    // Normal - Green
    if (rbsNum >= 70 && rbsNum <= 139) {
      return '#28a745'; // Green
    }
    // Pre-Diabetes - Yellow
    if (rbsNum >= 140 && rbsNum <= 199) {
      return '#ffc107'; // Yellow
    }
    // Suspected Diabetes - Orange
    if (rbsNum >= 200) {
      return '#ff8c00'; // Orange
    }

    return '#000';
  }

}

