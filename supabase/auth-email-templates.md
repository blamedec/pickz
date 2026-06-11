# PickFour Supabase Auth Email Templates

Supabase sends hosted Auth emails from the project dashboard or Management API, not from the Vite app bundle. Keep these templates with the repo, then paste them into **Supabase Dashboard > Authentication > Email Templates** for the production project.

The app sends this metadata with `signInWithOtp`:

- `{{ .Data.app_name }}`: PickFour
- `{{ .Data.display_name }}`: the entered display name
- `{{ .Data.username }}`: same as display name, written this way for email copy
- `{{ .Data.role_label }}`: player or league organiser
- `{{ .Data.league_name }}`: active league name, invite code context, or "your PickFour leagues"
- `{{ .Data.invite_code }}`: invite code when one is known
- `{{ .Data.return_url }}`: app URL used for the auth redirect
- `{{ .Data.sign_in_reason }}`: short reason line for the email
- `{{ .Data.cta_label }}`: Open PickFour

Supabase's default SMTP restrictions can limit custom template editing on newer free projects. If the dashboard blocks HTML template changes, use custom SMTP or update the project plan before relying on this copy in production.

## Recommended Simple Magic Link / OTP

Use this for the **Magic Link / OTP** template if you only care about the information being clear.

Subject:

```text
Your PickFour sign-in link
```

HTML body:

```html
<h2>Your PickFour sign-in link</h2>

<p>Hi {{ if .Data.display_name }}{{ .Data.display_name }}{{ else }}there{{ end }},</p>

<p>
  Use the link below to sign in to PickFour and get back to the leagues connected to
  <strong>{{ .Email }}</strong>.
</p>

<p>
  Username: <strong>{{ if .Data.username }}{{ .Data.username }}{{ else }}PickFour player{{ end }}</strong><br>
  Role: <strong>{{ if .Data.role_label }}{{ .Data.role_label }}{{ else }}player{{ end }}</strong><br>
  League: <strong>{{ if .Data.league_name }}{{ .Data.league_name }}{{ else }}your PickFour leagues{{ end }}</strong>
  {{ if .Data.invite_code }}<br>Invite code: <strong>{{ .Data.invite_code }}</strong>{{ end }}
</p>

<p>
  <a href="{{ .ConfirmationURL }}">Open PickFour</a>
</p>

<p>
  No password is needed. This link is useful if you switch devices, clear your browser,
  or need to get back to your leagues from the same email address.
</p>

<p>If you did not ask for this, you can ignore this email.</p>
```

Plain text fallback:

```text
Your PickFour sign-in link

Hi {{ if .Data.display_name }}{{ .Data.display_name }}{{ else }}there{{ end }},

Use the link below to sign in to PickFour and get back to the leagues connected to {{ .Email }}.

Username: {{ if .Data.username }}{{ .Data.username }}{{ else }}PickFour player{{ end }}
Role: {{ if .Data.role_label }}{{ .Data.role_label }}{{ else }}player{{ end }}
League: {{ if .Data.league_name }}{{ .Data.league_name }}{{ else }}your PickFour leagues{{ end }}
{{ if .Data.invite_code }}Invite code: {{ .Data.invite_code }}{{ end }}

Open PickFour:
{{ .ConfirmationURL }}

No password is needed. This link is useful if you switch devices, clear your browser, or need to get back to your leagues from the same email address.

If you did not ask for this, you can ignore this email.
```

## Designed Magic Link / OTP

Use this for the **Magic Link / OTP** template. This is the main PickFour return-link email.

Subject:

```text
Your PickFour sign-in link is ready
```

HTML body:

```html
<div style="margin:0;padding:32px;background:#f6f1e8;color:#111111;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ded6c8;border-radius:18px;overflow:hidden;">
    <div style="padding:28px 28px 20px;background:#111111;color:#fffaf0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff2f5f;">PickFour</p>
      <h1 style="margin:0;font-size:28px;line-height:1.1;">
        Back to your picks{{ if .Data.display_name }}, {{ .Data.display_name }}{{ end }}.
      </h1>
    </div>

    <div style="padding:28px;">
      <p style="margin:0 0 16px;font-size:17px;">
        Your sign-in link is ready for <strong>{{ if .Data.league_name }}{{ .Data.league_name }}{{ else }}PickFour{{ end }}</strong>.
      </p>
      <p style="margin:0 0 20px;color:#4b463f;">
        No password, no fuss. Use this email if you switch devices, clear your browser, or need PickFour to find the leagues connected to <strong>{{ .Email }}</strong>.
      </p>

      <div style="margin:0 0 24px;padding:16px;border-radius:12px;background:#f6f1e8;border:1px solid #e5ded2;">
        <p style="margin:0 0 6px;color:#6c655d;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">Account</p>
        <p style="margin:0;color:#111111;">
          Username: <strong>{{ if .Data.username }}{{ .Data.username }}{{ else }}PickFour player{{ end }}</strong><br>
          Role: <strong>{{ if .Data.role_label }}{{ .Data.role_label }}{{ else }}player{{ end }}</strong>
          {{ if .Data.invite_code }}<br>Invite code: <strong>{{ .Data.invite_code }}</strong>{{ end }}
        </p>
      </div>

      <p style="margin:0 0 24px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;min-height:48px;padding:14px 24px;border-radius:8px;background:#e71d36;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;">
          {{ if .Data.cta_label }}{{ .Data.cta_label }}{{ else }}Open PickFour{{ end }}
        </a>
      </p>

      <p style="margin:0;color:#6c655d;font-size:14px;">
        This link signs you in once and expires shortly. If you did not ask for it, you can ignore this email.
      </p>
    </div>
  </div>
</div>
```

Plain text fallback:

```text
Back to PickFour{{ if .Data.display_name }}, {{ .Data.display_name }}{{ end }}.

Your sign-in link is ready for {{ if .Data.league_name }}{{ .Data.league_name }}{{ else }}PickFour{{ end }}.

Username: {{ if .Data.username }}{{ .Data.username }}{{ else }}PickFour player{{ end }}
Role: {{ if .Data.role_label }}{{ .Data.role_label }}{{ else }}player{{ end }}
{{ if .Data.invite_code }}Invite code: {{ .Data.invite_code }}{{ end }}

Open PickFour:
{{ .ConfirmationURL }}

This signs in {{ .Email }} and brings back the leagues connected to that email. If you did not ask for this, you can ignore it.
```

## Confirm Signup

If the project sends a separate confirmation email for first-time users, use this for **Confirm signup**.

Subject:

```text
Confirm your PickFour sign-up
```

HTML body:

```html
<div style="margin:0;padding:32px;background:#f6f1e8;color:#111111;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ded6c8;border-radius:18px;overflow:hidden;">
    <div style="padding:28px 28px 20px;background:#111111;color:#fffaf0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff2f5f;">PickFour</p>
      <h1 style="margin:0;font-size:28px;line-height:1.1;">
        Confirm your place{{ if .Data.display_name }}, {{ .Data.display_name }}{{ end }}.
      </h1>
    </div>

    <div style="padding:28px;">
      <p style="margin:0 0 16px;font-size:17px;">
        You are signing up as <strong>{{ if .Data.username }}{{ .Data.username }}{{ else }}a PickFour player{{ end }}</strong>.
      </p>
      <p style="margin:0 0 20px;color:#4b463f;">
        Confirm this email so your leagues, picks and leaderboard spot stay attached to <strong>{{ .Email }}</strong>.
      </p>

      <p style="margin:0 0 24px;">
        <a href="{{ .ConfirmationURL }}" style="display:inline-block;min-height:48px;padding:14px 24px;border-radius:8px;background:#e71d36;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;">
          Confirm and open PickFour
        </a>
      </p>

      <p style="margin:0;color:#6c655d;font-size:14px;">
        If this was not you, ignore this email and nothing changes.
      </p>
    </div>
  </div>
</div>
```

## Management API Payload

If you prefer to apply the templates through Supabase's Management API, update the auth config with these keys:

```json
{
  "mailer_subjects_magic_link": "Your PickFour sign-in link is ready",
  "mailer_templates_magic_link_content": "<div style=\"margin:0;padding:32px;background:#f6f1e8;color:#111111;font-family:Arial,Helvetica,sans-serif;line-height:1.5;\"><div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ded6c8;border-radius:18px;overflow:hidden;\"><div style=\"padding:28px 28px 20px;background:#111111;color:#fffaf0;\"><p style=\"margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff2f5f;\">PickFour</p><h1 style=\"margin:0;font-size:28px;line-height:1.1;\">Back to your picks{{ if .Data.display_name }}, {{ .Data.display_name }}{{ end }}.</h1></div><div style=\"padding:28px;\"><p style=\"margin:0 0 16px;font-size:17px;\">Your sign-in link is ready for <strong>{{ if .Data.league_name }}{{ .Data.league_name }}{{ else }}PickFour{{ end }}</strong>.</p><p style=\"margin:0 0 20px;color:#4b463f;\">No password, no fuss. Use this email if you switch devices, clear your browser, or need PickFour to find the leagues connected to <strong>{{ .Email }}</strong>.</p><div style=\"margin:0 0 24px;padding:16px;border-radius:12px;background:#f6f1e8;border:1px solid #e5ded2;\"><p style=\"margin:0 0 6px;color:#6c655d;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;\">Account</p><p style=\"margin:0;color:#111111;\">Username: <strong>{{ if .Data.username }}{{ .Data.username }}{{ else }}PickFour player{{ end }}</strong><br>Role: <strong>{{ if .Data.role_label }}{{ .Data.role_label }}{{ else }}player{{ end }}</strong>{{ if .Data.invite_code }}<br>Invite code: <strong>{{ .Data.invite_code }}</strong>{{ end }}</p></div><p style=\"margin:0 0 24px;\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;min-height:48px;padding:14px 24px;border-radius:8px;background:#e71d36;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;\">{{ if .Data.cta_label }}{{ .Data.cta_label }}{{ else }}Open PickFour{{ end }}</a></p><p style=\"margin:0;color:#6c655d;font-size:14px;\">This link signs you in once and expires shortly. If you did not ask for it, you can ignore this email.</p></div></div></div>",
  "mailer_subjects_confirmation": "Confirm your PickFour sign-up",
  "mailer_templates_confirmation_content": "<div style=\"margin:0;padding:32px;background:#f6f1e8;color:#111111;font-family:Arial,Helvetica,sans-serif;line-height:1.5;\"><div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ded6c8;border-radius:18px;overflow:hidden;\"><div style=\"padding:28px 28px 20px;background:#111111;color:#fffaf0;\"><p style=\"margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff2f5f;\">PickFour</p><h1 style=\"margin:0;font-size:28px;line-height:1.1;\">Confirm your place{{ if .Data.display_name }}, {{ .Data.display_name }}{{ end }}.</h1></div><div style=\"padding:28px;\"><p style=\"margin:0 0 16px;font-size:17px;\">You are signing up as <strong>{{ if .Data.username }}{{ .Data.username }}{{ else }}a PickFour player{{ end }}</strong>.</p><p style=\"margin:0 0 20px;color:#4b463f;\">Confirm this email so your leagues, picks and leaderboard spot stay attached to <strong>{{ .Email }}</strong>.</p><p style=\"margin:0 0 24px;\"><a href=\"{{ .ConfirmationURL }}\" style=\"display:inline-block;min-height:48px;padding:14px 24px;border-radius:8px;background:#e71d36;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;text-align:center;\">Confirm and open PickFour</a></p><p style=\"margin:0;color:#6c655d;font-size:14px;\">If this was not you, ignore this email and nothing changes.</p></div></div></div>"
}
```
