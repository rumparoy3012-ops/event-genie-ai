/**
 * TimelineChecklist – Interactive milestone timeline with phase grouping
 * Features: phase grouping, completion toggles, live progress, aria-live updates
 */

import React, { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Clock, Calendar, Star } from 'lucide-react';
import type { MilestoneTask, MilestonePhase } from '../types/event';

interface TimelineChecklistProps {
  tasks: MilestoneTask[];
  onTaskToggle: (taskId: string) => void;
}

const PHASE_ORDER: MilestonePhase[] = ['Months Out', 'Weeks Out', 'Day of Event'];

const PHASE_META: Record<MilestonePhase, { icon: React.ReactNode; color: string; description: string }> = {
  'Months Out': {
    icon: <Calendar size={16} aria-hidden="true" />,
    color: '#8b5cf6',
    description: 'Long-lead tasks that require months of planning and vendor booking',
  },
  'Weeks Out': {
    icon: <Clock size={16} aria-hidden="true" />,
    color: '#06b6d4',
    description: 'Confirmation and finalisation tasks in the final weeks before the event',
  },
  'Day of Event': {
    icon: <Star size={16} aria-hidden="true" />,
    color: '#f59e0b',
    description: 'On-the-day execution tasks for a seamless event experience',
  },
};

export const TimelineChecklist: React.FC<TimelineChecklistProps> = ({ tasks, onTaskToggle }) => {
  const [expandedPhases, setExpandedPhases] = useState<Set<MilestonePhase>>(
    new Set(['Months Out', 'Weeks Out', 'Day of Event']),
  );

  const grouped = useMemo(() => {
    return PHASE_ORDER.reduce<Record<MilestonePhase, MilestoneTask[]>>((acc, phase) => {
      acc[phase] = tasks
        .filter(t => t.phase === phase)
        .sort((a, b) => a.dueDateOffsetDays - b.dueDateOffsetDays);
      return acc;
    }, {} as Record<MilestonePhase, MilestoneTask[]>);
  }, [tasks]);

  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const togglePhase = (phase: MilestonePhase) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  };

  return (
    <section aria-labelledby="timeline-heading" className="panel">
      <header className="panel-header">
        <div className="panel-header-left">
          <Calendar size={20} className="panel-icon" aria-hidden="true" />
          <h3 id="timeline-heading" className="panel-title">Planning Timeline</h3>
        </div>
        <span className="panel-badge">{completedCount}/{totalCount} tasks</span>
      </header>

      {/* Overall Progress */}
      <div className="timeline-progress-wrap">
        <div className="timeline-progress-header">
          <span className="timeline-progress-label">Overall Completion</span>
          <span
            className="timeline-progress-pct"
            aria-live="polite"
            aria-label={`${progressPct}% of planning tasks completed`}
          >
            {progressPct}%
          </span>
        </div>
        <div
          className="timeline-progress-track"
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Planning progress: ${progressPct}% complete`}
        >
          <div
            className="timeline-progress-fill"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        {progressPct === 100 && (
          <p
            className="timeline-complete-msg"
            role="status"
            aria-live="polite"
          >
            🎉 All tasks complete — you're ready for the big day!
          </p>
        )}
      </div>

      {/* Phase Groups */}
      <div className="timeline-phases">
        {PHASE_ORDER.map(phase => {
          const phaseTasks = grouped[phase];
          if (phaseTasks.length === 0) return null;
          const phaseCompleted = phaseTasks.filter(t => t.isCompleted).length;
          const isExpanded = expandedPhases.has(phase);
          const meta = PHASE_META[phase];

          return (
            <article key={phase} className="phase-group">
              {/* Phase Header (accordion toggle) */}
              <button
                type="button"
                onClick={() => togglePhase(phase)}
                className="phase-header-btn"
                aria-expanded={isExpanded}
                aria-controls={`phase-tasks-${phase.replace(/\s/g, '-')}`}
                aria-describedby={`phase-desc-${phase.replace(/\s/g, '-')}`}
              >
                <div className="phase-header-left">
                  <span
                    className="phase-icon-wrap"
                    style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </span>
                  <div>
                    <span className="phase-title">{phase}</span>
                    <span
                      id={`phase-desc-${phase.replace(/\s/g, '-')}`}
                      className="phase-desc sr-only"
                    >
                      {meta.description}
                    </span>
                  </div>
                </div>
                <div className="phase-header-right">
                  <span
                    className="phase-completion-badge"
                    style={{
                      backgroundColor: phaseCompleted === phaseTasks.length
                        ? '#10b98120' : `${meta.color}20`,
                      color: phaseCompleted === phaseTasks.length ? '#10b981' : meta.color,
                    }}
                    aria-label={`${phaseCompleted} of ${phaseTasks.length} tasks complete`}
                  >
                    {phaseCompleted}/{phaseTasks.length}
                  </span>
                  <span className={`phase-chevron ${isExpanded ? 'phase-chevron-open' : ''}`} aria-hidden="true">
                    ▾
                  </span>
                </div>
              </button>

              {/* Task List */}
              {isExpanded && (
                <ul
                  id={`phase-tasks-${phase.replace(/\s/g, '-')}`}
                  className="phase-task-list"
                  aria-label={`${phase} tasks`}
                >
                  {phaseTasks.map(task => (
                    <li key={task.id} className={`task-item ${task.isCompleted ? 'task-completed' : ''}`}>
                      <button
                        type="button"
                        onClick={() => onTaskToggle(task.id)}
                        className="task-toggle-btn"
                        aria-pressed={task.isCompleted}
                        aria-label={`${task.isCompleted ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                      >
                        {task.isCompleted ? (
                          <CheckCircle2
                            size={20}
                            className="task-check-done"
                            aria-hidden="true"
                          />
                        ) : (
                          <Circle
                            size={20}
                            className="task-check-empty"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                      <div className="task-content">
                        <p className={`task-title ${task.isCompleted ? 'task-title-done' : ''}`}>
                          {task.title}
                        </p>
                        <p className="task-description">{task.description}</p>
                        <p className="task-timing">
                          <Clock size={11} aria-hidden="true" />
                          {task.dueDateOffsetDays === 0
                            ? 'Day of Event'
                            : `${Math.abs(task.dueDateOffsetDays)} days before the event`}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
