# IISM Gulmarg form autofill

A Chrome extension that fills the [IISM Gulmarg admission form](https://admission.iismgulmarg.in/admission_form.aspx) in one click. Seats for snow skiing courses fill quickly, so it saves your details once and enters them, including document uploads, the moment the form opens.

Everything stays in your browser. Nothing is sent anywhere except into the admission form itself.

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.
5. Optional: pin the extension from the puzzle-piece menu in the toolbar.

Keep the folder in place. Chrome reads the extension from it directly.

## Set up your details (once, before registration opens)

Click the extension icon. Everything saves automatically, and a "✓ Saved" note appears at the top.

| Section | What to enter |
| --- | --- |
| Course | Course, level and schedule. Matched by text against the form's options, for example `Snow Skiing Courses at Gulmarg`. Leave level and schedule blank to pick the first available. |
| Personal | Name, father's name, date of birth (`dd/MM/yyyy`), nationality, domicile and state. |
| Contact and address | House number, street, city, PIN code (6 digits), mobile (10 digits) and email. |
| Health and fitness | Education, diet, blood group, medical category, height, weight, waist and shoe size. |
| Emergency contact | Name and 10-digit phone number. |
| Documents | Birth certificate, education qualification, applicant photo and signature are required. Domicile proof and adventure course photo are optional. |

Fields marked with a red **\*** are required by the form.

### Document rules

- Only `.jpg`, `.jpeg` or `.png`.
- Each file must be under 500 KB.
- A saved file shows a green "✓ filename (size)". Use **Replace** or **Remove** to change it.

### Parent or guardian signature

This is required only if the participant is under 18. The red star appears once your date of birth makes the participant a minor. The extension uploads the file only in that case.

## Use on registration day

1. Open the admission form link, which includes your mobile number as `?mobile=...`.
2. Click the blue **AutoFill** button at the bottom right of the page, or click the extension icon and then **Fill this tab**.
3. Wait for "✓ Filled — review, then click Submit".
4. Check the details and click **Submit** yourself. The extension never submits for you.

The form reloads itself when you choose the course, level, schedule, state and date of birth. The extension waits and carries on after each reload, so give it a few seconds.

### Auto-run

Turn on **Auto-run when the form opens** in the popup to fill the form as soon as the page loads, with no click needed.

## Tips

- Do a dry run before registration opens. The form may not accept submissions yet, but you can check that every field fills correctly. Do not submit during the dry run.
- Reload the form tab a minute before opening time so the page is fresh.
- If a level or schedule doesn't match, leave it blank or fix the text, and the extension will pick the first available option.
- If the popup says to open the form first, reload the form tab and try again.

## How it works

- `content.js` runs on the admission form page. It adds the **AutoFill** button and fills the fields, waiting for each postback and resuming after reloads.
- `popup.html` and `popup.js` are the setup screen. Your details and documents are saved in `chrome.storage.local`.
- `fields.js` holds the field definitions, the required fields and the file rules.

## Limitations

- This works only with the current layout of the IISM form. If the site changes its field names, the extension needs updating.
- Captchas or extra steps the site adds later are not handled.
- This is an unofficial tool and is not affiliated with IISM.
