import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-translation-box',
  templateUrl: './translation-box.component.html',
  styleUrls: ['./translation-box.component.scss']
})
export class TranslationBoxComponent {
  /** Text to display in label */
  @Input() label: string = 'Review the advice translated';

  /** Translated text to show */
  @Input() translatedText: string = '';

  /** Tab type (optional) if you want to customize based on section */
  @Input() tabType: string = '';

  /** Emits event when user confirms translation */
  @Output() confirm = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }
}
