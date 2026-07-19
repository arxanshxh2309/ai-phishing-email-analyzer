export interface MitreTechnique {
  id: string;
  name: string;
}

// MITRE ATT&CK technique IDs are MITRE's own stable identifiers — not invented here.
// Not every finding code needs an entry; codes with no mapping simply render no badge.
export const MITRE_TECHNIQUES: Record<string, MitreTechnique> = {
  "auth.spf_fail": { id: "T1656", name: "Impersonation" },
  "auth.dkim_fail": { id: "T1656", name: "Impersonation" },
  "auth.dmarc_fail": { id: "T1656", name: "Impersonation" },
  "spoof.reply_to_mismatch": { id: "T1656", name: "Impersonation" },
  "spoof.display_name_impersonation": { id: "T1656", name: "Impersonation" },
  "spoof.lookalike_domain": { id: "T1656", name: "Impersonation" },
  "link.ip_literal": { id: "T1566.002", name: "Spearphishing Link" },
  "link.punycode": { id: "T1566.002", name: "Spearphishing Link" },
  "link.brand_in_subdomain": { id: "T1566.002", name: "Spearphishing Link" },
  "link.anchor_mismatch": { id: "T1566.002", name: "Spearphishing Link" },
  "link.shortener": { id: "T1566.002", name: "Spearphishing Link" },
  "content.credential_harvest": { id: "T1598.003", name: "Phishing for Information: Spearphishing Link" },
  "content.sensitive_info_request": { id: "T1598", name: "Phishing for Information" },
  "attachment.dangerous_ext": { id: "T1566.001", name: "Spearphishing Attachment" },
  "attachment.double_extension": { id: "T1566.001", name: "Spearphishing Attachment" },
  "attachment.macro": { id: "T1204.002", name: "User Execution: Malicious File" },
};
