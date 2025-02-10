import React from "react";
import { formatCurrency } from "@/lib/utils";

export interface MonthlyReportData {
  data: {
    [x: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  };
}
const MonthlyReport = ({ data }: MonthlyReportData) => {
  const {
    income_analysis,
    expence_analysis,
    health_analysis,
    income,
    expenses,
    netFlow,
    currencyName,
    reportDate,
    health,
    insights,
  } = data;
  const getHealthColor = (health: string) => {
    switch (health) {
      case "red":
        return "#f31260";
      case "yellow":
        return "#f5a524";
      case "green":
        return "#17c964";
      default:
        return "#17c964";
    }
  };
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
            {`Your financial report for ${reportDate}`}
          </div>
          <div
            style={{
              textAlign: "left",
              whiteSpace: "nowrap",
              fontSize: 12,
              color: "#454545",
              marginBottom: 30,
            }}
          >
            Financal health status:
            <span
              style={{
                marginLeft: 4,
                backgroundColor: getHealthColor(health),
                borderRadius: "50%",
                width: "10px",
                height: "10px",
                verticalAlign: "middle",
                display: "inline-block",
              }}
            />
          </div>
          <div
            style={{
              marginTop: 12,
              color: "#454545",
              fontSize: 14,
              marginBottom: 30,
            }}
          >
            {insights}
          </div>
          <table width="100%">
            <tbody>
              <tr>
                <td
                  width="auto"
                  style={{
                    fontSize: 16,
                    borderBottom: "2px dotted #cecece",
                  }}
                >
                  Income
                </td>
                <td
                  width="100%"
                  style={{
                    borderBottom: "2px dotted #cecece",
                  }}
                ></td>
                <td
                  width="auto"
                  style={{
                    fontSize: 16,
                    textAlign: "right",
                    borderBottom: "2px dotted #cecece",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(income, currencyName)}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              marginTop: 12,
              color: "#454545",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {income_analysis}
          </div>
          <table width="100%">
            <tbody>
              <tr>
                <td
                  width="auto"
                  style={{
                    fontSize: 16,
                    borderBottom: "2px dotted #cecece",
                  }}
                >
                  Expenses
                </td>
                <td
                  width="100%"
                  style={{
                    borderBottom: "2px dotted #cecece",
                  }}
                ></td>
                <td
                  width="auto"
                  style={{
                    fontSize: 16,
                    textAlign: "right",
                    borderBottom: "2px dotted #cecece",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(Math.abs(expenses), currencyName)}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              marginTop: 12,
              color: "#454545",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            {expence_analysis}
          </div>
          <table width="100%">
            <tbody>
              <tr>
                <td
                  width="auto"
                  style={{
                    whiteSpace: "nowrap",
                    fontSize: 16,
                    borderBottom: "2px dotted #cecece",
                    fontWeight: "bold",
                  }}
                >
                  Net Flow
                </td>
                <td
                  width="100%"
                  style={{
                    borderBottom: "2px dotted #cecece",
                  }}
                ></td>
                <td
                  width="auto"
                  style={{
                    fontSize: 16,
                    textAlign: "right",
                    borderBottom: "2px dotted #cecece",
                    color: netFlow > 0 ? "#17c964" : "#f31260",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatCurrency(netFlow, currencyName)}
                </td>
              </tr>
            </tbody>
          </table>
          <div
            style={{
              marginTop: 12,
              color: "#454545",
              fontSize: 14,
            }}
          >
            {health_analysis}
          </div>
        </div>
        <div
          style={{
            margin: "0 8px",
          }}
        >
          <div
            style={{
              backgroundImage:
                "url('https://hujivekupajsyi6h.public.blob.vercel-storage.com/slip-AnD8aS5N6UDxkV9VhQd43B3m6s4BV0.png')",
              padding: "30px 20px 40px",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              color: "#454545",
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
    </div>
  );
};

export default MonthlyReport;
