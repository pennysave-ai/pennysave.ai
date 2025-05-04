import React from "react";
import { formatCurrency } from "@/lib/utils";

export interface BudgetExceedNotifcationProps {
  budget: {
    frequency: string;
    name: string;
    totalAmount: number;
    amountSpent: number;
    currency: string;
  };
  userName: string;
}
const BudgetExceedNotifcation = ({
  budget,
  userName,
}: BudgetExceedNotifcationProps) => {
  const { frequency, name, totalAmount, amountSpent, currency } = budget;
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "auto",
          padding: "20px 0",
          backgroundColor: "#ffffff",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            margin: "0px 8px",
            padding: "20px",
            backgroundColor: "#f0f0f0!important",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px",
          }}
        >
          <div
            style={{
              color: "#11181c",
              fontSize: 20,
              fontWeight: "bold",
            }}
          >
            {`Your ${frequency.toLowerCase()} budget has exceeded your alert threshold.`}
          </div>
          <div
            style={{
              marginTop: 12,
              color: "#454545",
              fontSize: 14,
              marginBottom: 30,
              overflowWrap: "break-word",
            }}
          >
            {`Dear ${userName}, your ${frequency.toLowerCase()} budget of ${name} has exceeded your alert threshold of ${formatCurrency(
              totalAmount,
              currency
            )}. Please review your spending or adjust your budget accordingly.`}
          </div>
          <table
            width="100%"
            cellPadding="0"
            cellSpacing="0"
            style={{
              tableLayout: "fixed",
              borderCollapse: "collapse",
              border: "1px solid #c3c3c3",
              borderTopLeftRadius: "8px",
              borderTopRightRadius: "8px",
              overflow: "hidden",
              fontFamily: "Arial, sans-serif",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{
                    color: "#454545",
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "10px",
                    backgroundColor: "#c3c3c3",
                  }}
                >
                  Budget Name
                </th>
                <th
                  style={{
                    color: "#454545",
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "10px",
                    backgroundColor: "#c3c3c3",
                    borderLeft: "1px solid #fff",
                    borderRight: "1px solid #fff",
                  }}
                >
                  Budgeted Amount
                </th>
                <th
                  style={{
                    color: "#454545",
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "10px",
                    backgroundColor: "#c3c3c3",
                  }}
                >
                  Spent
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  borderBottom: "2px solid #c3c3c3",
                  borderLeft: "2px solid #c3c3c3",
                  borderRight: "2px solid #c3c3c3",
                }}
              >
                <td
                  style={{
                    width: "33%",
                    padding: "10px",
                    fontSize: 12,
                    color: "#454545",
                    overflowWrap: "break-word",
                  }}
                >
                  {name}
                </td>
                <td
                  width="auto"
                  style={{
                    width: "33%",
                    padding: "10px",
                    fontSize: 12,
                    color: "#454545",
                    borderLeft: "1px solid #c3c3c3",
                    borderRight: "1px solid #c3c3c3",
                  }}
                >
                  {`${formatCurrency(totalAmount, currency)}`}
                </td>
                <td
                  width="auto"
                  style={{
                    width: "33%",
                    padding: "10px",
                    fontSize: 12,
                    color: "#f31260",
                  }}
                >
                  {`${formatCurrency(amountSpent, currency)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div
          style={{
            margin: "0 8px",
            backgroundColor: "#f0f0f0",
            padding: "0 20px 20px",
            borderBottomRightRadius: "8px",
            borderBottomLeftRadius: "8px",
          }}
        >
          <table>
            <tbody>
              <tr>
                <td width="100%"></td>
                <td
                  width="auto"
                  style={{
                    whiteSpace: "nowrap",
                    color: "#454545!important",
                    fontSize: 12,
                  }}
                >
                  <a
                    href="https://pennysave.ai/settings"
                    style={{
                      color: "#454545!important",
                    }}
                  >
                    unsubscribe
                  </a>
                  {" | "}
                  <a
                    href="https://pennysave.ai"
                    style={{
                      color: "#454545!important",
                    }}
                  >
                    pennysave.ai
                  </a>{" "}
                  | 2025
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BudgetExceedNotifcation;
