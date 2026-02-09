import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NcdReportComponent } from './ncd-report.component';

const routes: Routes = [
  {
    path: '',
    component: NcdReportComponent
  }
];

@NgModule({
  declarations: [
    NcdReportComponent
  ],
  imports: [
    RouterModule.forChild(routes),
    CommonModule
  ],
  exports: [NcdReportComponent]
})
export class NcdReportModule { }

