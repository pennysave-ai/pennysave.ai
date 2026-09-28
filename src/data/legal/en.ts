import type { LegalCatalogEntry } from "./types";

/**
 * The source text, taken verbatim from the pages published at
 * /terms-of-service and /privacy-policy. Every other language in this
 * directory is a translation of this file — when the wording here changes, the
 * translations are stale until they are updated and re-reviewed.
 */
const en: LegalCatalogEntry = {
  reviewed: true,
  documents: {
    terms: {
      label: "Terms of Service",
      summary:
        "Use PennySave for your own finances, keep your account details accurate and safe, and we’ll keep the service running — as is, with no guarantees about the numbers it shows you.",
      links: [{ phrase: "Privacy Policy", href: "/privacy-policy" }],
      sections: [
        {
          title: "Introduction",
          body: "Welcome to pennysave.ai (“we”, “us”, or “our”). These Terms of Service (“Terms”) govern your use of our personal finance management web application (“Service”), accessible at http://pennysave.ai. By accessing or using our Service, you agree to be bound by these Terms. If you do not agree, please do not use our Service.",
          points: [],
        },
        {
          title: "Acceptance of Terms",
          body: "By creating an account or accessing the Service, you confirm that you have read, understood, and agree to these Terms and our Privacy Policy.",
          points: [],
        },
        {
          title: "Eligibility",
          body: "You must be at least 13 years old or the age of majority in your jurisdiction to use this Service. By using the Service, you represent and warrant that you meet these requirements.",
          points: [],
        },
        {
          title: "Account Registration",
          body: "To access certain features of our Services, you may be required to create an account. You agree to:",
          points: [
            "Provide accurate and current information during the registration process.",
            "Maintain the security and confidentiality of your account credentials.",
            "Notify us immediately of any unauthorized use of your account or breach of security.",
            "To connect your depersonalized data with AI models.",
            "You are solely responsible for all activity that occurs under your account.",
          ],
        },
        {
          title: "Use of the Service",
          body: "",
          points: [
            "The Service is provided for your personal, non-commercial use only.",
            "You agree not to misuse the Service or use it for any unlawful purpose.",
            "You may not attempt to gain unauthorized access to any part of the Service or its related systems.",
          ],
        },
        {
          title: "Data and Privacy",
          body: "By using our Services, you agree to the collection, use, and processing of your data as described in our Privacy Policy. You retain ownership of all data you submit to the Services, but you grant us a license to use, store, and process such data for the purpose of providing the Services. We do not sell or share your personal data with third parties for their marketing purposes.",
          points: [
            "Your use of the Service is also governed by our Privacy Policy.",
            "We do not sell your personal financial information to third parties.",
            "You are responsible for the accuracy of the data you provide.",
          ],
        },
        {
          title: "User Content",
          body: "",
          points: [
            "You retain ownership of any data or content you submit to the Service.",
            "By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and process your content solely for the purpose of providing the Service.",
          ],
        },
        {
          title: "Disclaimer of Warranties",
          body: "",
          points: [
            "The Service is provided “as is” and “as available” without warranties of any kind.",
            "We do not guarantee the accuracy, completeness, or timeliness of the information provided.",
            "Your use of the Service is at your own risk.",
          ],
        },
        {
          title: "Limitation of Liability",
          body: "",
          points: [
            // The published page still reads "[YourAppName]" here — an unfilled
            // template placeholder. Named properly in this structured copy.
            "To the fullest extent permitted by law, PennySave and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of or inability to use the Service.",
            "Our total liability shall not exceed the amount you paid to use the Service, if any.",
          ],
        },
        {
          title: "Termination",
          body: "We reserve the right to suspend or terminate your access to the Service at our sole discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users or the Service.",
          points: [],
        },
        {
          title: "Changes to Terms",
          body: "We reserve the right to modify these Terms at any time. Any changes will be posted on our website and become effective upon posting. Your continued use of the Services after the changes take effect constitutes your acceptance of the modified Terms.",
          points: [],
        },
        {
          title: "Contact Us",
          body: "If you have any questions about these Terms, please contact us at support@pennysave.ai.",
          points: [],
        },
      ],
    },
    privacy: {
      label: "Privacy Policy",
      summary:
        "We collect what we need to run your account and give you financial insights — including financial data — encrypt it, connect it to AI models only in depersonalised form, and never sell or share it for marketing.",
      sections: [
        {
          title: "General statement",
          body: 'pennysave.ai ("we", "us", "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website application ("Service"). Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not use the Service.',
          points: [],
        },
        {
          title: "Our Mission",
          body: "Our mission is to help you with your finances by giving you insights and recommendations based on your financial data. Combining the both AI and finance worlds we believe we can make smart finance simple.",
          points: [],
        },
        {
          title: "Information We Collect",
          body: "We may collect and process the following types of information:",
          points: [
            "Personal Information: Name, Username, Email address, password, and other authentication details.",
            "Financial Information: Bank account details, transaction history and other financial data.",
            "Usage Data: browser type, access time and pages viewed.",
            "Cookies and Tracking Technologies Cookies: Small data files stored on your device to enhance user experience.",
          ],
        },
        {
          title: "How We Use Your Information",
          body: "We use the information we collect for various purposes, including the following:",
          points: [
            "To create and manage your account and provide customer support.",
            "To analyze usage patterns, improve features, and develop new services.",
            "To send you updates, reports and other information related to your account.",
            "To connect your depersonalized data with AI models.",
          ],
        },
        {
          title: "Security",
          body: "We take reasonable measures to protect your information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or electronic storage is completely secure, and we cannot guarantee absolute security. We implement appropriate technical and organizational measures to safeguard the security of your personal data, including sensitive data that you may choose to share within the Services. These measures may include:",
          points: [
            "Encryption: We employ encryption technologies to protect your data both in transit and at rest.",
            "Access Controls: We implement strict access controls to limit who can access your data.",
            "Data Minimization: We collect and retain only the minimum necessary personal data required to provide the Services.",
          ],
        },
        {
          title: "How We Share Your Information",
          body: "We do not sell or share your personal data with third parties for their marketing purposes. We may share your information with third parties in the following circumstances:",
          points: [
            "Legal Requirements: We may disclose your information if required by law or in response to legal processes, such as a court order or subpoena.",
            "Business Transfers: In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new owner.",
          ],
        },
        {
          title: "Data Retention",
          body: "We store your personal data for as long as you have an account with us. You can request the deletion of your personal data at any time by emailing support@pennysave.ai.",
          points: [],
        },
        {
          title: "Your Rights (GDPR)",
          body: "Under the GDPR, you have the following rights:",
          points: [
            "Access: You have the right to request a copy of your personal data.",
            "Rectification: You have the right to correct inaccurate or incomplete personal data.",
            "Erasure: You have the right to request the deletion of your personal data.",
            "Restriction of Processing: You have the right to restrict the processing of your personal data in certain circumstances.",
            "Data Portability: You have the right to receive your personal data in a structured, commonly used, and machine-readable format.",
            "Object: You have the right to object to the processing of your personal data in certain circumstances. To exercise any of these rights, please contact us at support@pennysave.ai.",
          ],
        },
        {
          title: "Children’s Privacy",
          body: "The Services are not intended for children under the age of 13. We do not knowingly collect personal information from children under 13.",
          points: [],
        },
        {
          title: "Changes to This Policy",
          body: "We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on the Services. You are advised to review this Privacy Policy periodically for any changes.",
          points: [],
        },
        {
          title: "Contact Us",
          body: "If you have any questions or concerns about this Privacy Policy or our data practices, contact us at support@pennysave.ai.",
          points: [],
        },
      ],
    },
  },
};

export default en;
