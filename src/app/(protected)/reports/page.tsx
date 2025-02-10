import React from "react";
import MonthlyReport from "@/templates/monthly-report";
import ResetPassword from "@/templates/reset-password";
import VerifyEmail from "@/templates/verify-email";

const Reports = () => {
  return (
    <div className="">
      <MonthlyReport
        data={{
          health: "green",
          income: 4810.66,
          netFlow: 4132.148888888889,
          expenses: -678.5111111111112,
          insights:
            "January was a bustling month for you! With a solid income of $4810.66 and relatively modest expenses totaling $678.51, you've managed a net cash flow of $4132.15. That's like hitting a mini jackpot every month! Your major income boost came from your salary, which is always a sweet sight on your bank statement. On the spending side, you've dabbled a bit in travel and some quick bites out. Notably, your travel expense with United Airlines took a $500 bite out of your budget, but hey, sometimes you've got to spread those wings!",
          reportDate: "January 2025",
          currencyName: "USD",
          currencySymbol: "$",
          health_analysis:
            "You're in the green zone! Your financial health is strong, with income far exceeding expenses. This positive net flow allows for potential savings and investments, securing your financial future.",
          income_analysis:
            "Your income is robust, primarily fueled by your salary. It's great to see that your main income source is stable and substantial, which provides a good financial cushion.",
          expence_analysis:
            "Your expenses are well-contained and diversified across necessities and some leisure, which suggests a balanced approach to spending. The largest expense was travel, indicating a possible area to watch or plan for more strategically in future budgets.",
        }}
      />
      <VerifyEmail confirmLink="/auth/verify-email?token=" />
      <ResetPassword confirmLink="/auth/new-password?token=" />
    </div>
  );
};

export default Reports;
