Ruban Customer Demo

This package contains ONLY the customer-facing demo page and its required styles/scripts.
It does not include the production customer app, atelier/tailor/admin panels, Supabase client setup,
or production authentication scripts.

Demo behavior:
- Opens directly without login.
- Uses sample customer, order, notification, atelier and chat data.
- Demo interactions remain in the browser and are not sent to Ruban's production database.
- Order form submission is simulated only.
- Voice recording, when browser permission is granted, is played locally and is not uploaded.

To publish on Netlify:
1. Open https://app.netlify.com/drop
2. Drag the extracted Ruban-Demo folder (not the ZIP file) into the drop area.
3. Wait for Netlify to publish and provide a public URL.
4. Share that URL with your reviewer.

The date picker and Persian font load from their public CDNs, so internet access is required.
