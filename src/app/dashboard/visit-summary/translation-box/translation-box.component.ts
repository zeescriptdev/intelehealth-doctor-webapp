import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { VisitService } from 'src/app/services/visit.service';

interface TabButtonState {
  showApprove: boolean;
  isApproveDisabled: boolean;
  showReject: boolean;
  showRetry: boolean;
}

@Component({
  selector: 'app-translation-box',
  templateUrl: './translation-box.component.html',
  styleUrls: ['./translation-box.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class TranslationBoxComponent implements OnChanges {
  @Input() hwStateData: { state: ''; language: ''; language_code: '' };
  @Input() translatedText: string = '';
  @Input() tabType: string = '';
  @Input() clickedFromParent!: boolean;

  @Output() action = new EventEmitter<{ tabType: string; action: string }>();

  // track states per tab
  tabButtonStates: Record<string, TabButtonState> = {};

  tabResponses: { [key: string]: any } = {};
  lastTranslatedValues: { [key: string]: string } = {};
  pendingTranslatedText: string | null = null;
  defaultText = ['Add instructions','Add advice','Enter reason'];

  constructor(private visitService: VisitService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['translatedText'] &&
      changes['translatedText'].currentValue !==
        changes['translatedText'].previousValue
    ) {
      const newValue = changes['translatedText'].currentValue;
      if (this.hwStateData?.language_code && this.tabType) {
        if (this.lastTranslatedValues[this.tabType] !== newValue) {
          this.lastTranslatedValues[this.tabType] = newValue;
          this.callApiForTab(this.tabType);
        }
      } else {
        this.pendingTranslatedText = newValue;
      }
    }

    if (
      changes['hwStateData'] &&
      this.hwStateData?.language_code &&
      this.tabType
    ) {
      if (this.pendingTranslatedText) {
        if (
          this.lastTranslatedValues[this.tabType] !==
          this.pendingTranslatedText
        ) {
          this.lastTranslatedValues[this.tabType] = this.pendingTranslatedText;
          this.callApiForTab(this.tabType);
        }
        this.pendingTranslatedText = null;
      }
    }

    if (changes['clickedFromParent'] && this.tabType) {
      this.ensureTabState(this.tabType);
      // disable approve initially
      this.tabButtonStates[this.tabType].isApproveDisabled = true;
    }
  }

  private ensureTabState(tabType: string) {
    if (!this.tabButtonStates[tabType]) {
      this.tabButtonStates[tabType] = {
        showApprove: true,
        isApproveDisabled: true,
        showReject: false,
        showRetry: false,
      };
    }
  }

  callApiForTab(tabType: string) {
    this.ensureTabState(tabType);

    this.visitService
      .getTranslatedText(
        this.translatedText,
        this.hwStateData?.language_code,
        tabType
      )
      .subscribe({
        next: (res) => {
          this.tabResponses[tabType] = res;
          // ✅ Success → Approve + Reject (only if clickedFromParent is true)
          this.tabButtonStates[tabType] = {
            showApprove: true,
            isApproveDisabled: this.defaultText.includes(this.translatedText) ? true : false,
            showReject: this.clickedFromParent ?? false,
            showRetry: false, // hide retry on success
          };
        },
        error: (err) => {
          console.error(`Error for ${tabType}:`, err);
          // ❌ Failure → Retry only
          this.tabButtonStates[tabType] = {
            showApprove: false,
            isApproveDisabled: true,
            showReject: false,
            showRetry: true,
          };
        },
      });
  }

  onApprove() {
    this.action.emit({ tabType: this.tabType, action: 'approve' });
  }

  onReject() {
     this.action.emit({ tabType: this.tabType, action: 'reject' });
  }

  onRetry() {
    if (this.tabType) {
   //   this.callApiForTab(this.tabType);
      this.action.emit({ tabType: this.tabType, action: 'retry' });
    }
  }

  // helpers for template
  shouldShowApprove(): boolean {
    return this.tabButtonStates[this.tabType]?.showApprove ?? true;
  }

  isApproveDisabled(): boolean {
    return this.tabButtonStates[this.tabType]?.isApproveDisabled ?? true;
  }

  shouldShowReject(): boolean {
    return this.tabButtonStates[this.tabType]?.showReject ?? false;
  }

  shouldShowRetry(): boolean {
    return this.tabButtonStates[this.tabType]?.showRetry ?? false;
  }
}
