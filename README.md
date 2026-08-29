# Baldor Safety Insights

Internal fleet-safety analytics for Baldor Transportation Safety. Hosted on Lovable. Data and auth live on this project's Lovable Cloud database.

## Upload sources (AI-Inputs)

Drop these workbooks on **Upload** (detection is by columns, not filename):

1. Incidents export — Occurrence Number + Loss Date
2. Samsara Driver Safety Report by Tag Summary — Driver Tag + Mobile Usage / Inattentive Driving
3. Miles by Jurisdiction and Tag by Month — Asset Tag Name + Distance

## First-time setup

The first account created on Login becomes admin. Keep this flow private.

## Charts

Five presentation families (type stack, APMM, YoY monthly, YoY matrix, distracted) with branch/range controls and PNG export.

## Local env

Copy `.env.example`. Values are Lovable Cloud client credentials, not a self-serve database project.
