export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface PriorityEvaluation {
  priority: PriorityLevel;
  score: number;
  reason: string;
  daysRemaining: number;
}

export class PriorityEngine {
  /**
   * Dynamic Priority Calculation Model:
   * Score = Urgency Weight + Importance Weight + Proximity Weight
   */
  static calculate(dueDateStr: string, actionType: string, category: string = 'Other'): PriorityEvaluation {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Base importance by category & action type
    let categoryWeight = 20;
    if (['Insurance', 'Bills'].includes(category)) categoryWeight = 40;
    else if (['Vehicle', 'Identity', 'Property'].includes(category)) categoryWeight = 30;

    let actionWeight = 20;
    if (['RENEW', 'PAY'].includes(actionType)) actionWeight = 40;
    else if (['SERVICE', 'SUBMIT', 'VERIFY'].includes(actionType)) actionWeight = 30;

    let proximityScore = 0;
    let priority: PriorityLevel = 'LOW';
    let reason = '';

    if (daysRemaining < 0) {
      proximityScore = 100;
      priority = 'CRITICAL';
      reason = `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) > 1 ? 's' : ''}`;
    } else if (daysRemaining === 0) {
      proximityScore = 95;
      priority = 'CRITICAL';
      reason = 'Due today!';
    } else if (daysRemaining <= 3) {
      proximityScore = 90;
      priority = 'CRITICAL';
      reason = `Critical — expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}`;
    } else if (daysRemaining <= 7) {
      proximityScore = 75;
      priority = 'HIGH';
      reason = `Due in ${daysRemaining} days`;
    } else if (daysRemaining <= 30) {
      proximityScore = 50;
      priority = (categoryWeight + actionWeight > 60) ? 'HIGH' : 'MEDIUM';
      reason = `Due in ${daysRemaining} days`;
    } else if (daysRemaining <= 60) {
      proximityScore = 30;
      priority = 'MEDIUM';
      reason = `Due in ${Math.round(daysRemaining / 7)} weeks`;
    } else {
      proximityScore = 10;
      priority = 'LOW';
      reason = `Expires in ${daysRemaining} days`;
    }

    const totalScore = categoryWeight + actionWeight + proximityScore;

    return {
      priority,
      score: totalScore,
      reason,
      daysRemaining,
    };
  }
}
