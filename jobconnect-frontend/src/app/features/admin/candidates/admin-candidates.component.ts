import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
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
    imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
    template: `
        <div class="admin-candidates">
            <header class="page-header">
                <div class="header-content">
                    <a routerLink="/admin/dashboard" class="back-link">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Dashboard
                    </a>
                    <h1>Manage Candidates</h1>
                </div>
                <button class="add-btn" (click)="openAddModal()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Candidate
                </button>
            </header>

            <div class="filters-bar">
                <div class="search-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.3-4.3"></path>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="Search candidates..." 
                        [(ngModel)]="searchQuery"
                        (input)="onSearch()"
                    />
                </div>
            </div>

            @if (loading()) {
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading candidates...</p>
                </div>
            } @else if (candidates().length === 0) {
                <div class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    <h3>No Candidates Found</h3>
                    <p>No candidates match your current search.</p>
                </div>
            } @else {
                <div class="candidates-table-container">
                    <table class="candidates-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Location</th>
                                <th>Skills</th>
                                <th>Applications</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (candidate of candidates(); track candidate.id) {
                                <tr>
                                    <td class="candidate-name">{{ candidate.firstName }} {{ candidate.lastName }}</td>
                                    <td>{{ candidate.email }}</td>
                                    <td>{{ candidate.location || '-' }}</td>
                                    <td>
                                        <div class="skills-list">
                                            @for (skill of (candidate.skills || []).slice(0, 3); track skill.skillId) {
                                                <span class="skill-badge">{{ skill.skillName }}</span>
                                            }
                                            @if ((candidate.skills || []).length > 3) {
                                                <span class="skill-badge more">+{{ (candidate.skills || []).length - 3 }}</span>
                                            }
                                        </div>
                                    </td>
                                    <td>{{ candidate.applicationCount }}</td>
                                    <td class="actions-cell">
                                        <button class="action-btn edit-btn" (click)="openEditModal(candidate)" title="Edit">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                            </svg>
                                        </button>
                                        <button class="action-btn delete-btn" (click)="deleteCandidate(candidate)" title="Delete">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            }

            <!-- Add/Edit Modal -->
            @if (showModal()) {
                <div class="modal-overlay" (click)="closeModal()">
                    <div class="modal-content" (click)="$event.stopPropagation()">
                        <div class="modal-header">
                            <h2>{{ editingCandidate() ? 'Edit Candidate' : 'Add New Candidate' }}</h2>
                            <button class="close-btn" (click)="closeModal()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                        <form [formGroup]="candidateForm" (ngSubmit)="submitForm()">
                            <div class="modal-body">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>First Name *</label>
                                        <input type="text" formControlName="firstName" placeholder="John">
                                    </div>
                                    <div class="form-group">
                                        <label>Last Name *</label>
                                        <input type="text" formControlName="lastName" placeholder="Doe">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Email *</label>
                                    <input type="email" formControlName="email" placeholder="john.doe@example.com">
                                </div>
                                @if (!editingCandidate()) {
                                    <div class="form-group">
                                        <label>Password *</label>
                                        <input type="password" formControlName="password" placeholder="Enter password">
                                    </div>
                                }
                                <div class="form-row">
                                    <div class="form-group">
                                        <label>Phone</label>
                                        <input type="text" formControlName="phone" placeholder="+1 234 567 890">
                                    </div>
                                    <div class="form-group">
                                        <label>Location</label>
                                        <input type="text" formControlName="location" placeholder="Paris, France">
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>Summary</label>
                                    <textarea formControlName="summary" rows="3" placeholder="Brief professional summary..."></textarea>
                                </div>
                                <div class="form-group">
                                    <label>Skills</label>
                                    <div class="skills-grid">
                                        @for (skill of skills(); track skill.id) {
                                            <button 
                                                type="button" 
                                                class="skill-chip" 
                                                [class.selected]="isSkillSelected(skill.id)"
                                                (click)="toggleSkill(skill.id)"
                                            >
                                                {{ skill.name }}
                                            </button>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
                                <button type="submit" class="btn-primary" [disabled]="saving()">
                                    @if (saving()) {
                                        <span class="spinner"></span>
                                        Saving...
                                    } @else {
                                        {{ editingCandidate() ? 'Update' : 'Create' }} Candidate
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .admin-candidates {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            flex-wrap: wrap;
            gap: 1rem;
        }

        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            color: #6366f1;
            text-decoration: none;
            font-weight: 500;
            margin-bottom: 1rem;
            transition: color 0.2s;
        }

        .back-link:hover {
            color: #4f46e5;
        }

        .page-header h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
        }

        .add-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .add-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .filters-bar {
            margin-bottom: 1.5rem;
        }

        .search-box {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.75rem 1rem;
            max-width: 400px;
        }

        .search-box svg {
            color: #94a3b8;
        }

        .search-box input {
            border: none;
            outline: none;
            width: 100%;
            font-size: 0.95rem;
        }

        .candidates-table-container {
            background: white;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }

        .candidates-table {
            width: 100%;
            border-collapse: collapse;
        }

        .candidates-table th {
            background: #f8fafc;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #475569;
            font-size: 0.875rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .candidates-table td {
            padding: 1rem;
            border-top: 1px solid #e2e8f0;
            color: #334155;
        }

        .candidate-name {
            font-weight: 600;
            color: #1e293b;
        }

        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .skill-badge {
            display: inline-block;
            padding: 0.2rem 0.5rem;
            background: #e0e7ff;
            color: #4338ca;
            font-size: 0.75rem;
            border-radius: 4px;
        }

        .skill-badge.more {
            background: #f1f5f9;
            color: #64748b;
        }

        .actions-cell {
            display: flex;
            gap: 0.5rem;
        }

        .action-btn {
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
        }

        .edit-btn {
            background: #e0e7ff;
            color: #4338ca;
        }

        .edit-btn:hover {
            background: #c7d2fe;
        }

        .delete-btn {
            background: #fee2e2;
            color: #dc2626;
        }

        .delete-btn:hover {
            background: #fecaca;
        }

        .loading-state,
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #64748b;
        }

        .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e2e8f0;
            border-top-color: #6366f1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .empty-state svg {
            color: #94a3b8;
            margin-bottom: 1rem;
        }

        .empty-state h3 {
            font-size: 1.25rem;
            color: #475569;
            margin-bottom: 0.5rem;
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
        }

        .modal-content {
            background: white;
            border-radius: 16px;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .modal-header h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
        }

        .close-btn {
            background: none;
            border: none;
            color: #64748b;
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 8px;
            transition: all 0.2s;
        }

        .close-btn:hover {
            background: #f1f5f9;
            color: #1e293b;
        }

        .modal-body {
            padding: 1.5rem;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.5rem;
        }

        .form-group input,
        .form-group textarea {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-size: 0.95rem;
            transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: #6366f1;
        }

        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .skill-chip {
            padding: 0.5rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            background: white;
            cursor: pointer;
            font-size: 0.875rem;
            transition: all 0.2s;
        }

        .skill-chip:hover {
            border-color: #6366f1;
        }

        .skill-chip.selected {
            background: #6366f1;
            color: white;
            border-color: #6366f1;
        }

        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            padding: 1.5rem;
            border-top: 1px solid #e2e8f0;
        }

        .btn-secondary {
            padding: 0.75rem 1.5rem;
            background: #f1f5f9;
            color: #475569;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            text-decoration: none;
        }

        .btn-secondary:hover {
            background: #e2e8f0;
        }

        .btn-primary {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .btn-primary:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .btn-primary .spinner {
            width: 16px;
            height: 16px;
            border-width: 2px;
            margin: 0;
        }

        @media (max-width: 768px) {
            .admin-candidates {
                padding: 1rem;
            }

            .form-row {
                grid-template-columns: 1fr;
            }

            .candidates-table th:nth-child(3),
            .candidates-table td:nth-child(3),
            .candidates-table th:nth-child(4),
            .candidates-table td:nth-child(4) {
                display: none;
            }
        }
    `]
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
    private searchTimeout: any;

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

    onSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => this.loadCandidates(), 300);
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
            // Update existing candidate
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
            // Create new candidate
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
