import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { ConfigService } from '../../../core/services/config.service';
import { SkillService } from '../../../core/services/skill.service';
import { NotificationService } from '../../../core/services/notification.service';
import { Skill } from '../../../core/models';

interface AdminCandidate {
    id: number;
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    summary?: string;
    location?: string;
    photoUrl?: string;
    skills?: { skillId: number; skillName: string; proficiencyLevel: number }[];
    applicationCount: number;
    createdAt: Date;
    updatedAt: Date;
}

@Component({
    selector: 'app-admin-candidates',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule],
    templateUrl: './admin-candidates.component.html',
    styleUrl: './admin-candidates.component.scss'
})
export class AdminCandidatesComponent implements OnInit {
    candidates = signal<AdminCandidate[]>([]);
    skills = signal<Skill[]>([]);
    loading = signal(true);
    saving = signal(false);
    showModal = signal(false);
    editingCandidate = signal<AdminCandidate | null>(null);
    selectedSkills = signal<number[]>([]);
    searchQuery = '';

    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    candidateForm!: FormGroup;

    constructor(
        private http: HttpClient,
        private configService: ConfigService,
        private skillService: SkillService,
        private notificationService: NotificationService,
        private fb: FormBuilder
    ) {
        this.initForm();
    }

    ngOnInit() {
        this.loadCandidates();
        this.skillService.getSkills().subscribe(skills => {
            this.skills.set(skills);
        });

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.loadCandidates();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    private initForm() {
        this.candidateForm = this.fb.group({
            firstName: ['', Validators.required],
            lastName: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: [''],
            phone: [''],
            location: [''],
            summary: ['']
        });
    }

    loadCandidates() {
        this.loading.set(true);
        let url = `${this.configService.apiUrl}/admin/candidates`;
        if (this.searchQuery) {
            url += `?search=${encodeURIComponent(this.searchQuery)}`;
        }

        this.http.get<AdminCandidate[]>(url).subscribe({
            next: (candidates) => {
                this.candidates.set(candidates);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
            }
        });
    }

    onSearchInput() {
        if (this.searchQuery.length === 0 || this.searchQuery.length >= 2) {
            this.searchSubject.next(this.searchQuery);
        }
    }

    openAddModal() {
        this.editingCandidate.set(null);
        this.candidateForm.reset();
        this.candidateForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        this.candidateForm.get('password')?.updateValueAndValidity();
        this.selectedSkills.set([]);
        this.showModal.set(true);
    }

    openEditModal(candidate: AdminCandidate) {
        this.editingCandidate.set(candidate);
        this.candidateForm.patchValue({
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            phone: candidate.phone || '',
            location: candidate.location || '',
            summary: candidate.summary || ''
        });
        this.candidateForm.get('password')?.clearValidators();
        this.candidateForm.get('password')?.updateValueAndValidity();
        this.selectedSkills.set(candidate.skills?.map(s => s.skillId) || []);
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.editingCandidate.set(null);
    }

    toggleSkill(skillId: number) {
        const current = this.selectedSkills();
        if (current.includes(skillId)) {
            this.selectedSkills.set(current.filter(id => id !== skillId));
        } else {
            this.selectedSkills.set([...current, skillId]);
        }
    }

    isSkillSelected(skillId: number): boolean {
        return this.selectedSkills().includes(skillId);
    }

    submitForm() {
        if (this.candidateForm.invalid) {
            this.candidateForm.markAllAsTouched();
            return;
        }

        this.saving.set(true);
        const formValue = this.candidateForm.value;

        if (this.editingCandidate()) {
            const updateData = {
                firstName: formValue.firstName,
                lastName: formValue.lastName,
                email: formValue.email,
                phone: formValue.phone || null,
                location: formValue.location || null,
                summary: formValue.summary || null,
                skillIds: this.selectedSkills()
            };

            this.http.put<AdminCandidate>(`${this.configService.apiUrl}/admin/candidates/${this.editingCandidate()!.id}`, updateData)
                .subscribe({
                    next: () => {
                        this.saving.set(false);
                        this.notificationService.success('Candidate updated successfully!');
                        this.closeModal();
                        this.loadCandidates();
                    },
                    error: (err) => {
                        this.saving.set(false);
                        this.notificationService.error(err.error?.message || 'Failed to update candidate');
                    }
                });
        } else {
            const createData = {
                firstName: formValue.firstName,
                lastName: formValue.lastName,
                email: formValue.email,
                password: formValue.password,
                phone: formValue.phone || null,
                location: formValue.location || null,
                summary: formValue.summary || null,
                skillIds: this.selectedSkills()
            };

            this.http.post<AdminCandidate>(`${this.configService.apiUrl}/admin/candidates`, createData)
                .subscribe({
                    next: () => {
                        this.saving.set(false);
                        this.notificationService.success('Candidate created successfully!');
                        this.closeModal();
                        this.loadCandidates();
                    },
                    error: (err) => {
                        this.saving.set(false);
                        this.notificationService.error(err.error?.message || 'Failed to create candidate');
                    }
                });
        }
    }

    deleteCandidate(candidate: AdminCandidate) {
        if (confirm(`Are you sure you want to delete ${candidate.firstName} ${candidate.lastName}? This action cannot be undone.`)) {
            this.http.delete(`${this.configService.apiUrl}/admin/candidates/${candidate.id}`).subscribe({
                next: () => {
                    this.candidates.update(c => c.filter(x => x.id !== candidate.id));
                    this.notificationService.success('Candidate deleted successfully');
                },
                error: () => {
                    this.notificationService.error('Failed to delete candidate');
                }
            });
        }
    }
}
