import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Heading,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";

interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export const styles = {
  main: {
    backgroundColor: "#e8ecee",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },
  container: {
    backgroundColor: "#f8f9fa",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    borderRadius: "5px",
    border: "1px solid #e9e6e0",
    maxWidth: "580px", 
  },
  header: {
    padding: "0 48px",
  },
  brand: {
    color: "#bc152b", // secondary (ProfeVision text)
    fontSize: "24px",
    fontWeight: "bold",
    margin: "0",
  },
  content: {
    padding: "0 48px",
  },
  footer: {
    padding: "0 48px",
    marginTop: "48px",
  },
  footerText: {
    color: "#64748b", // muted
    fontSize: "12px",
    lineHeight: "1.5",
  },
};

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.header}>
             <Heading style={styles.brand}>ProfeVision</Heading>
          </Section>
          
          <Section style={styles.content}>
            {children}
          </Section>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              ProfeVision © {new Date().getFullYear()}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default BaseLayout;
