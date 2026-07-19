export interface SampleEmail {
  id: string;
  label: string;
  description: string;
  raw: string;
}

// Curated demo content for first-time visitors — deliberately hand-written
// for public display, distinct from the fixtures/ dev-test corpus.
export const SAMPLE_EMAILS: SampleEmail[] = [
  {
    id: "phishing",
    label: "Phishing example",
    description: "Spoofed PayPal, punycode link, fake attachment",
    raw: `Delivered-To: victim@example.com
Received: from mail-relay.suspicious-host.ru (unknown [203.0.113.55])
	by mx.example.com with SMTP id abc123
	for <victim@example.com>; Sun, 19 Jul 2026 10:15:00 +0000
Authentication-Results: mx.example.com; spf=fail smtp.mailfrom=paypa1-secure.com; dkim=fail; dmarc=fail
Received-SPF: fail (mx.example.com: domain of paypa1-secure.com does not designate 203.0.113.55 as permitted sender)
From: "PayPal Security Team" <service@paypa1-secure.com>
Reply-To: paypal-support@mail-recovery-help.tk
To: victim@example.com
Subject: Urgent: Your account will be suspended within 24 hours
Date: Sun, 19 Jul 2026 10:14:58 +0000
Message-ID: <a1b2c3d4@paypa1-secure.com>
Content-Type: multipart/mixed; boundary="BOUNDARY1"
MIME-Version: 1.0

--BOUNDARY1
Content-Type: text/html; charset="UTF-8"
Content-Transfer-Encoding: 7bit

<html>
<body>
<p>Dear Customer,</p>
<p>We have detected suspicious activity on your account. Your account will be suspended within 24 hours unless you verify your account immediately.</p>
<p>Please <a href="http://xn--pypal-4ve.com/verify-account/login.php">click here to verify your account</a> now to avoid permanent closure.</p>
<p>You may also visit <a href="http://192.168.44.21/secure/login">this secure link</a> if the above does not work.</p>
<p>Failure to respond within 24 hours will result in permanent suspension.</p>
<p>PayPal Security Team</p>
</body>
</html>

--BOUNDARY1
Content-Type: application/octet-stream; name="Account_Verification_Form.pdf.exe"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="Account_Verification_Form.pdf.exe"

VGhpcyBpcyBub3QgYSByZWFsIGV4ZWN1dGFibGUsIGp1c3QgdGVzdCBjb250ZW50Lg==

--BOUNDARY1--
`,
  },
  {
    id: "clean",
    label: "Clean example",
    description: "A legitimate GitHub notification",
    raw: `Delivered-To: dev@example.com
Received: from smtp.github.com (smtp.github.com [140.82.112.22])
	by mx.example.com with ESMTPS id def456
	for <dev@example.com>; Sun, 19 Jul 2026 09:00:00 +0000
Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=notifications@github.com; dkim=pass header.d=github.com; dmarc=pass header.from=github.com
Received-SPF: pass (mx.example.com: domain of github.com designates 140.82.112.22 as permitted sender)
From: "GitHub" <notifications@github.com>
Reply-To: notifications@github.com
To: dev@example.com
Subject: [octocat/hello-world] New comment on your pull request
Date: Sun, 19 Jul 2026 09:00:00 +0000
Message-ID: <pr-comment-9988@github.com>
Content-Type: text/html; charset="UTF-8"
MIME-Version: 1.0

<html>
<body>
<p>Hi devuser,</p>
<p>alice-dev commented on your pull request #42 in octocat/hello-world:</p>
<blockquote>Looks good to me, thanks for the fix!</blockquote>
<p><a href="https://github.com/octocat/hello-world/pull/42#issuecomment-1234567">View it on GitHub</a></p>
<p>You are receiving this because you authored the thread.</p>
</body>
</html>
`,
  },
  {
    id: "borderline",
    label: "Borderline example",
    description: "Legitimate marketing email with urgency language",
    raw: `Delivered-To: shopper@example.com
Received: from mail129.suremail.example.net (mail129.suremail.example.net [198.51.100.9])
	by mx.example.com with ESMTPS id ghi789
	for <shopper@example.com>; Sun, 19 Jul 2026 08:00:00 +0000
Authentication-Results: mx.example.com; spf=pass smtp.mailfrom=bounce.acmeshop.com; dkim=pass header.d=acmeshop.com; dmarc=pass header.from=acmeshop.com
Received-SPF: pass (mx.example.com: domain of bounce.acmeshop.com designates 198.51.100.9 as permitted sender)
From: "Acme Shop Deals" <deals@acmeshop.com>
Reply-To: deals@acmeshop.com
To: shopper@example.com
Subject: Act now: Flash sale ends tonight!
Date: Sun, 19 Jul 2026 08:00:00 +0000
Message-ID: <campaign-55321@acmeshop.com>
Content-Type: text/html; charset="UTF-8"
MIME-Version: 1.0

<html>
<body>
<p>Hi there,</p>
<p>Our biggest flash sale of the year ends tonight! Act now and save 40% storewide.</p>
<p><a href="https://acmeshop.com/sale/summer-2026">Shop the sale</a></p>
<p>Thanks for being a loyal Acme Shop customer.</p>
<p>Unsubscribe: <a href="https://acmeshop.com/unsubscribe?id=9981">click here</a></p>
</body>
</html>
`,
  },
];
