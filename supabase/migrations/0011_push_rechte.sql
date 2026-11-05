-- Push (8b-3): Die Edge Function "send-push" laeuft als service_role und muss die Warteschlange lesen und als gesendet markieren
-- sowie tote Geraete-Tokens loeschen. 0008 hat alle Tabellenrechte entzogen, deshalb hier gezielt oeffnen (nur lesen/markieren/loeschen).
grant select, update on public.notification_queue to service_role;
grant select, delete on public.devices to service_role;
