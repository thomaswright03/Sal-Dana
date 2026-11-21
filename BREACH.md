# Breach plan

- Decides: Alan (owner) with Thomas (Wright AI Solutions). Contact Thomas first.
- Contain: change `CRM_PASSWORD` in Vercel (signs everyone out), rotate the Blob read-write token (Vercel Storage), rotate `ANTHROPIC_API_KEY` and `CRON_SECRET`, redeploy.
- Investigate: Vercel runtime logs and Blob access; note what was exposed, when, and whose.
- Notify: under A.R.S. §18-551/552, notice to affected Arizona residents within 45 days of determining a breach of personal information (name plus SSN, driver licence, financial account, etc.); notify the Arizona AG and credit bureaus if more than 1,000 people. Names, phones and addresses alone mostly fall outside this definition, but tell affected customers anyway.
- Afterwards: write down what happened and update this file.
