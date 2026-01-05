import { Component, OnInit, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KanbanBoardComponent } from '../kanban-board/kanban-board.component';
import { CompanyService } from '../../../core/services/company.service';
import { JobService } from '../../../core/services/job.service';
import { Application, JobPosting } from '../../../core/models';

@Component({
  selector: 'app-candidates-view',
  standalone: true,
  imports: [CommonModule, KanbanBoardComponent],
  template: `
    <div class="candidates-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading candidates...</p>
        </div>
      } @else if (job()) {
        <!-- Hero Header -->
        <div class="page-header">
          <div class="header-orb header-orb-1"></div>
          <div class="header-orb header-orb-2"></div>

          <div class="header-badge">
            <span class="badge-icon">👥</span>
            <span>Candidate Pipeline</span>
          </div>

          <h1>{{ job()?.title }} <span class="gradient-text">Candidates</span></h1>
          <p>Manage and track applicants through your hiring pipeline</p>

          <div class="stats-bar">
            <div class="stat-item">
              <span class="stat-number">{{ job()?.applicationCount || 0 }}</span>
              <span class="stat-label">Applications</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number location">{{ job()?.location || 'Remote' }}</span>
              <span class="stat-label">Location</span>
            </div>
          </div>

          <div class="filter-controls">
            <button class="filter-btn" [class.active]="sortBy() === 'score'" (click)="sortByScore()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              Match Score
            </button>
            <button class="filter-btn" [class.active]="sortBy() === 'date'" (click)="sortByDate()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Date Applied
            </button>
          </div>
        </div>

        <div class="kanban-container">
          <app-kanban-board [jobId]="jobIdNum"></app-kanban-board>
        </div>
      }
    </div>
  `,
  styles: [`
    /* Animations */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0); }
      50% { transform: translate(10px, -10px); }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .candidates-page {
      min-height: 100vh;
      background: var(--bg-secondary);
    }

    /* Page Header */
    .page-header {
      text-align: center;
      padding: 3rem 2rem 2rem;
      position: relative;
      overflow: hidden;
      background: var(--bg-secondary);

      h1 {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--text-primary);
        margin-bottom: 0.75rem;
        letter-spacing: -0.03em;
        animation: fadeInUp 0.6s ease backwards;
        animation-delay: 0.1s;

        @media (max-width: 768px) {
          font-size: 1.75rem;
        }
      }

      p {
        color: var(--text-secondary);
        font-size: 1rem;
        max-width: 450px;
        margin: 0 auto 1.5rem;
        animation: fadeInUp 0.6s ease backwards;
        animation-delay: 0.2s;
      }
    }

    .gradient-text {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Header Orbs */
    .header-orb {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      animation: float 8s ease-in-out infinite;
    }

    .header-orb-1 {
      top: -50px;
      left: 5%;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 60%);
    }

    .header-orb-2 {
      top: 0;
      right: 10%;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, transparent 60%);
      animation-delay: 2s;
    }

    /* Header Badge */
    .header-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-glass-strong);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-full);
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      color: var(--text-secondary);
      margin-bottom: 1.25rem;
      animation: fadeInUp 0.6s ease backwards;

      .badge-icon {
        font-size: 1rem;
      }
    }

    /* Stats Bar */
    .stats-bar {
      display: inline-flex;
      align-items: center;
      gap: 1.5rem;
      background: var(--bg-glass-strong);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--border-light);
      border-radius: var(--radius-full);
      padding: 0.75rem 1.5rem;
      margin-bottom: 1.5rem;
      animation: fadeInUp 0.6s ease backwards;
      animation-delay: 0.3s;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;

      .stat-number {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--accent-soft);

        &.location {
          font-size: 0.9375rem;
          color: var(--text-primary);
        }
      }

      .stat-label {
        font-size: 0.6875rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .stat-divider {
      width: 1px;
      height: 32px;
      background: var(--border-default);
    }

    /* Filter Controls */
    .filter-controls {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      animation: fadeInUp 0.6s ease backwards;
      animation-delay: 0.4s;
    }

    .filter-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-primary);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-full);
      padding: 0.625rem 1.25rem;
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-base);
      box-shadow: var(--shadow-xs);

      svg {
        opacity: 0.7;
      }

      &:hover {
        border-color: var(--border-strong);
        box-shadow: var(--shadow-sm);
        transform: translateY(-2px);
      }

      &.active {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15));
        border-color: var(--accent-soft);
        color: var(--accent-soft);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);

        svg {
          opacity: 1;
        }
      }
    }

    /* Kanban Container */
    .kanban-container {
      padding: 0 2rem 2rem;
      animation: fadeInUp 0.6s ease backwards;
      animation-delay: 0.5s;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      color: var(--text-secondary);
      animation: fadeInUp 0.5s ease;

      .spinner {
        width: 44px;
        height: 44px;
        border: 3px solid var(--border-default);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
        margin-bottom: 1rem;
      }
    }
  `]
})
export class CandidatesViewComponent implements OnInit {
  @Input() id!: string;

  job = signal<JobPosting | null>(null);
  loading = signal(true);
  sortBy = signal<'score' | 'date'>('score');

  get jobIdNum(): number {
    return parseInt(this.id);
  }

  constructor(private jobService: JobService) { }

  ngOnInit() {
    this.jobService.getJob(this.jobIdNum).subscribe({
      next: (job) => {
        this.job.set(job);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  sortByScore() {
    this.sortBy.set('score');
  }

  sortByDate() {
    this.sortBy.set('date');
  }
}
