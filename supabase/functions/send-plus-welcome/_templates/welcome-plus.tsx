import {
  Text,
  Button,
  Section,
  Heading,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { BaseLayout } from "./base-layout.tsx";

interface WelcomePlusEmailProps {
  dashboardUrl: string;
  translation: {
    subject: string;
    heading: string;
    intro: string;
    benefitsTitle: string;
    benefits: {
      aiUnlimited: string;
      scansUnlimited: string;
      exportPdf: string;
      exportLatex: string;
      prioritySupport: string;
    };
    comingSoonTitle: string;
    comingSoon: {
      bulkOperations: string;
    };
    button: string;
    footer: string;
  };
}

export const WelcomePlusEmail = ({
  dashboardUrl,
  translation: t,
}: WelcomePlusEmailProps) => {
  const benefitsList = [
    t.benefits.aiUnlimited,
    t.benefits.scansUnlimited,
    t.benefits.exportPdf,
    t.benefits.exportLatex,
    t.benefits.prioritySupport,
  ];

  const comingSoonList = [
    t.comingSoon.bulkOperations,
  ];

  return (
    <BaseLayout preview={t.subject}>
      <Heading style={headingStyle}>{t.heading}</Heading>
      
      <Text style={textStyle}>{t.intro}</Text>
      
      <Text style={benefitsTitleStyle}>{t.benefitsTitle}</Text>
      
      <Section style={benefitsSection}>
        {benefitsList.map((benefit, i) => (
          <Text key={i} style={benefitItemStyle}>✓ {benefit}</Text>
        ))}
      </Section>

      <Text style={comingSoonTitleStyle}>{t.comingSoonTitle}</Text>
      
      <Section style={comingSoonSection}>
        {comingSoonList.map((item, i) => (
          <Text key={i} style={comingSoonItemStyle}>⏳ {item}</Text>
        ))}
      </Section>
      
      <Section style={buttonSection}>
        <Button style={buttonStyle} href={dashboardUrl}>
          {t.button}
        </Button>
      </Section>
      
      <Text style={footerStyle}>{t.footer}</Text>
    </BaseLayout>
  );
};

// Estilos
const headingStyle = {
  color: "#040316",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 24px",
};

const textStyle = {
  color: "#040316",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const benefitsTitleStyle = {
  color: "#040316",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const benefitsSection = {
  margin: "0 0 24px",
};

const benefitItemStyle = {
  color: "#040316",
  fontSize: "15px",
  lineHeight: "1.8",
  margin: "0",
  paddingLeft: "8px",
};

const comingSoonTitleStyle = {
  color: "#64748b",
  fontSize: "15px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const comingSoonSection = {
  margin: "0 0 24px",
  padding: "12px",
  backgroundColor: "#f0f0f0",
  borderRadius: "4px",
};

const comingSoonItemStyle = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.8",
  margin: "0",
  paddingLeft: "8px",
  fontStyle: "italic" as const,
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const buttonStyle = {
  backgroundColor: "#0b890f",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const footerStyle = {
  color: "#64748b",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "24px 0 0",
};

export default WelcomePlusEmail;
