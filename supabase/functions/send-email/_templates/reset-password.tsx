import {
  Button,
  Text,
  Heading,
} from "npm:@react-email/components@0.0.22";
import * as React from "npm:react@18.3.1";
import { BaseLayout } from "./base-layout.tsx";
import { Translation } from "../_translations/index.ts";

interface ResetPasswordEmailProps {
  token: string;
  token_hash: string;
  redirect_to: string;
  supabase_url: string;
  translation: Translation["resetPassword"];
  commonTranslation: Translation["common"];
}

export const ResetPasswordEmail = ({
  token,
  token_hash,
  redirect_to,
  supabase_url,
  translation,
  commonTranslation,
}: ResetPasswordEmailProps) => {
  // Construct verify URL
  const verifyUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${redirect_to}`;

  return (
    <BaseLayout preview={translation.subject}>
      <Heading style={styles.heading}>{translation.heading}</Heading>
      <Text style={styles.text}>{translation.body}</Text>
      
      <Button style={styles.button} href={verifyUrl}>
        {translation.button}
      </Button>
      
      <Text style={styles.text}>
        {translation.otp.replace("{token}", token)}
      </Text>
      
      <Text style={styles.smallText}>
        {translation.footer}
      </Text>
      <Text style={styles.smallText}>
        {commonTranslation.expires}
      </Text>
    </BaseLayout>
  );
};

const styles = {
  heading: {
    fontSize: "24px",
    fontWeight: "normal",
    textAlign: "left" as const,
    margin: "30px 0",
    color: "#040316",
  },
  text: {
    color: "#040316",
    fontSize: "16px",
    lineHeight: "24px",
    textAlign: "left" as const,
  },
  button: {
    backgroundColor: "#0b890f", // primary
    borderRadius: "5px",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    textAlign: "center" as const,
    display: "block",
    width: "100%",
    padding: "10px",
    margin: "24px 0",
  },
  smallText: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "12px",
  },
};

export default ResetPasswordEmail;
