import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationBoxComponent } from './translation-box.component';

describe('TranslationBoxComponent', () => {
  let component: TranslationBoxComponent;
  let fixture: ComponentFixture<TranslationBoxComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TranslationBoxComponent]
    });
    fixture = TestBed.createComponent(TranslationBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
