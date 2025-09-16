import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { VisitService } from 'src/app/services/visit.service';

@Component({
  selector: 'app-translation-box',
  templateUrl: './translation-box.component.html',
  styleUrls: ['./translation-box.component.scss']
})
export class TranslationBoxComponent implements OnChanges {

  /** Text to display in label */
  @Input() hwStateData: { state: '', language: '', language_code: '' };
  //  @Input() label: string = 'Review the advice translated';

  /** Translated text to show */
  @Input() translatedText: string = '';

  /** Tab type (optional) if you want to customize based on section */
  @Input() tabType: string = '';

  /** Emits event when user confirms translation */
  @Output() confirm = new EventEmitter<void>();

  translatedAdvice: string;
  translatedInstruction: string;
  translatedReason: string;
  tabResponses: { [key: string]: any } = {}; // cache responses by tabType

  constructor(private visitService: VisitService) { }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['translatedText'] || (this.hwStateData && this.tabType)) {
        this.callApiForTab(this.tabType);
    }
    console.log("hwStateData", this.translatedAdvice);
    console.log("hwStateData", this.translatedInstruction);
  }

  onConfirm() {
    this.confirm.emit();
  }

  callApiForTab(tabType: string) {
    this.visitService.getTranslatedText(this.translatedText, this.hwStateData?.language_code, this.tabType).subscribe({
      next: (res) => {
        this.tabResponses[tabType] = res; // store response by tabType
      },
      error: (err) => console.error(`Error for ${tabType}:`, err)
    });
    console.log('this.tabRes', this.tabResponses)
  }
}
