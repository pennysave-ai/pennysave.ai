import React from "react";

interface VerifyEmailProps {
  confirmLink: string;
}

const VerifyEmail = ({ confirmLink }: VerifyEmailProps) => {
  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#fff",
      }}
    >
      <div
        style={{
          width: "600px",
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
            Confirm your email address
          </div>
          <table width="100%">
            <tbody>
              <tr>
                <td
                  width="100%"
                  style={{
                    borderBottom: "2px dotted #cecece",
                  }}
                ></td>
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
            Please click the following <a href={confirmLink}>link</a> to confirm
            your email address.
            <div>
              <span style={{ fontWeight: "bold" }}>Please Note:</span> the link
              will be valid for 1 hour only.
            </div>
          </div>
        </div>
        <div
          style={{
            margin: "0 8px",
          }}
        >
          <div
            style={{
              borderBottomRightRadius: "8px",
              borderBottomLeftRadius: "8px",
              padding: "30px 20px 40px",
              background: "#f0f0f0",
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

export default VerifyEmail;
