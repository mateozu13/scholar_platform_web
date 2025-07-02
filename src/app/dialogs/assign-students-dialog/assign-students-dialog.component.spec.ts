import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignStudentsDialogComponent } from './assign-students-dialog.component';

describe('AssignStudentsDialogComponent', () => {
  let component: AssignStudentsDialogComponent;
  let fixture: ComponentFixture<AssignStudentsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AssignStudentsDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignStudentsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
