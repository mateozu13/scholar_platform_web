import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignProfessorDialogComponent } from './assign-professor-dialog.component';

describe('AssignProfessorDialogComponent', () => {
  let component: AssignProfessorDialogComponent;
  let fixture: ComponentFixture<AssignProfessorDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssignProfessorDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignProfessorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
