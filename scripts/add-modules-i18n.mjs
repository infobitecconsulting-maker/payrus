// Merge-only: adds the business-modules keys to every locale without touching existing keys.
import { readFileSync, writeFileSync } from "node:fs";
const K = {
  "nav.modules": ["Business modules", "Modules métier", "Módulos de negócio", "Módulos de negocio"],
  "modules.title": ["Business modules", "Modules métier", "Módulos de negócio", "Módulos de negocio"],
  "modules.subtitle": ["Tools unlocked by your account specialisation", "Outils débloqués par la spécialisation de votre compte", "Ferramentas desbloqueadas pela especialização da sua conta", "Herramientas desbloqueadas por la especialización de su cuenta"],
  "modules.chooseSpecialisation": ["Choose your specialisation", "Choisissez votre spécialisation", "Escolha a sua especialização", "Elija su especialización"],
  "modules.specialisationHint": ["Your role stays the same; a specialisation adds the tools your type of organisation needs. You can change it any time.", "Votre rôle reste le même ; une spécialisation ajoute les outils dont votre type d'organisation a besoin. Modifiable à tout moment.", "A sua função não muda; uma especialização acrescenta as ferramentas de que o seu tipo de organização precisa. Pode alterá-la a qualquer momento.", "Su rol no cambia; una especialización añade las herramientas que necesita su tipo de organización. Puede cambiarla en cualquier momento."],
  "modules.specialisationSaved": ["Specialisation saved", "Spécialisation enregistrée", "Especialização guardada", "Especialización guardada"],
  "modules.enhancedKyc": ["Enhanced KYC/AML/FATF verification · dedicated relationship manager", "Vérification renforcée KYC/AML/GAFI · gestionnaire de relation dédié", "Verificação reforçada KYC/AML/GAFI · gestor de relacionamento dedicado", "Verificación reforzada KYC/AML/GAFI · gestor de relación dedicado"],
  "modules.approvalsQueue": ["Waiting for your approval", "En attente de votre approbation", "A aguardar a sua aprovação", "Pendiente de su aprobación"],
  "modules.preparedBy": ["prepared by", "préparé par", "preparado por", "preparado por"],
  "modules.approve": ["Approve", "Approuver", "Aprovar", "Aprobar"],
  "modules.approved": ["Approved", "Approuvé", "Aprovado", "Aprobado"],
  "modules.none": ["No business modules are enabled for this profile.", "Aucun module métier n'est activé pour ce profil.", "Nenhum módulo de negócio está ativo para este perfil.", "No hay módulos de negocio activos para este perfil."],
  "modules.notEnabled": ["This module is not enabled for your profile.", "Ce module n'est pas activé pour votre profil.", "Este módulo não está ativo para o seu perfil.", "Este módulo no está activo para su perfil."],
  "modules.new": ["New", "Nouveau", "Novo", "Nuevo"],
  "modules.create": ["Create", "Créer", "Criar", "Crear"],
  "modules.created": ["Created", "Créé", "Criado", "Creado"],
  "modules.save": ["Save", "Enregistrer", "Guardar", "Guardar"],
  "modules.runPayroll": ["Run payroll from employee register", "Lancer la paie depuis le registre du personnel", "Processar salários a partir do registo de funcionários", "Ejecutar nómina desde el registro de empleados"],
  "modules.payrollPeriod": ["Pay period (e.g. 2026-10)", "Période de paie (ex. 2026-10)", "Período de pagamento (ex. 2026-10)", "Periodo de pago (p. ej. 2026-10)"],
  "modules.payrollCreated": ["Payroll run created — submit it for approval", "Paie créée — soumettez-la pour approbation", "Processamento criado — submeta para aprovação", "Nómina creada — envíela para aprobación"],
  "modules.journal": ["Accounting journal (CSV)", "Journal comptable (CSV)", "Diário contabilístico (CSV)", "Diario contable (CSV)"],
  "modules.empty": ["Nothing here yet.", "Rien pour l'instant.", "Ainda nada aqui.", "Nada por aquí todavía."],
  "modules.col.ref": ["Reference", "Référence", "Referência", "Referencia"],
  "modules.col.title": ["Title", "Titre", "Título", "Título"],
  "modules.col.amount": ["Amount", "Montant", "Montante", "Importe"],
  "modules.col.status": ["Status", "Statut", "Estado", "Estado"],
  "modules.counterparty": ["Counterparty", "Contrepartie", "Contraparte", "Contraparte"],
  "modules.currency": ["Currency", "Devise", "Moeda", "Moneda"],
  "modules.due": ["Due date", "Échéance", "Vencimento", "Vencimiento"],
  "modules.lines": ["Invoice lines", "Lignes de facture", "Linhas da fatura", "Líneas de factura"],
  "modules.addLine": ["Add line", "Ajouter une ligne", "Adicionar linha", "Añadir línea"],
  "modules.total": ["Total", "Total", "Total", "Total"],
  "modules.distributionHint": ["The amount is split pro rata across active members/investors by shares or units held. The last holder absorbs rounding so the total is exact.", "Le montant est réparti au prorata entre les membres/investisseurs actifs selon les parts détenues. Le dernier absorbe l'arrondi pour un total exact.", "O montante é repartido proporcionalmente pelos membros/investidores ativos conforme as partes detidas. O último absorve o arredondamento.", "El importe se reparte a prorrata entre los miembros/inversores activos según las participaciones. El último absorbe el redondeo."],
  "modules.fourEyesAbove": ["Four-eyes: a second authorised person must approve amounts of {{n}} or more.", "Double validation : une seconde personne autorisée doit approuver les montants à partir de {{n}}.", "Dupla validação: uma segunda pessoa autorizada deve aprovar montantes a partir de {{n}}.", "Doble validación: una segunda persona autorizada debe aprobar importes desde {{n}}."],
  "modules.fourEyesAlways": ["Four-eyes: a second authorised person must approve this.", "Double validation : une seconde personne autorisée doit approuver.", "Dupla validação: uma segunda pessoa autorizada deve aprovar.", "Doble validación: una segunda persona autorizada debe aprobar."],
  "modules.gateNote": ["🔒 needs a second authorised approver — they will see it under “Waiting for your approval”.", "🔒 nécessite un second approbateur autorisé — il le verra sous « En attente de votre approbation ».", "🔒 requer um segundo aprovador autorizado — verá em “A aguardar a sua aprovação”.", "🔒 requiere un segundo aprobador autorizado — lo verá en «Pendiente de su aprobación»."],
  "modules.schedule": ["Repayment schedule", "Échéancier de remboursement", "Plano de reembolso", "Calendario de reembolso"],
  "modules.month": ["month", "mois", "mês", "mes"],
  "modules.voteTally": ["Vote tally", "Résultat du vote", "Contagem de votos", "Recuento de votos"],
  "modules.for": ["for", "pour", "a favor", "a favor"],
  "modules.against": ["against", "contre", "contra", "en contra"],
  "modules.abstain": ["abstain", "abstention", "abstenção", "abstención"],
  "modules.quorum": ["quorum", "quorum", "quórum", "quórum"],
  "modules.tallySaved": ["Tally saved", "Résultat enregistré", "Contagem guardada", "Recuento guardado"],
  "modules.tallyHint": ["Closing the vote decides the outcome from the tally and quorum — it cannot be chosen by hand.", "La clôture du vote détermine le résultat d'après le décompte et le quorum — il ne peut pas être choisi manuellement.", "O encerramento do voto decide o resultado pela contagem e quórum — não pode ser escolhido manualmente.", "El cierre de la votación decide el resultado según el recuento y el quórum; no puede elegirse a mano."],
  "modules.recurring": ["Recurring", "Récurrent", "Recorrente", "Recurrente"],
  "modules.repeat": ["Repeat", "Répéter", "Repetir", "Repetir"],
  "modules.stop": ["Stop", "Arrêter", "Parar", "Detener"],
  "modules.recurringSet": ["Recurrence set — starts tomorrow", "Récurrence définie — démarre demain", "Recorrência definida — começa amanhã", "Recurrencia definida — empieza mañana"],
  "modules.recurringGenerated": ["{{count}} recurring document(s) generated", "{{count}} document(s) récurrent(s) généré(s)", "{{count}} documento(s) recorrente(s) gerado(s)", "{{count}} documento(s) recurrente(s) generado(s)"],
  "profile.subProfile.title": ["What type of organisation?", "Quel type d'organisation ?", "Que tipo de organização?", "¿Qué tipo de organización?"],
  "profile.subProfile.optional": ["Optional — you can choose or change this later under Business modules.", "Facultatif — vous pourrez le choisir ou le modifier plus tard dans Modules métier.", "Opcional — pode escolher ou alterar mais tarde em Módulos de negócio.", "Opcional — puede elegirlo o cambiarlo más tarde en Módulos de negocio."],
  "profile.subProfile.saveFailed": ["Role saved, but the specialisation could not be saved. Choose it under Business modules.", "Rôle enregistré, mais la spécialisation n'a pas pu l'être. Choisissez-la dans Modules métier.", "Função guardada, mas a especialização não pôde ser guardada. Escolha-a em Módulos de negócio.", "Rol guardado, pero no se pudo guardar la especialización. Elíjala en Módulos de negocio."],
  "modules.linked": ["Linked records", "Enregistrements liés", "Registos associados", "Registros vinculados"],
};
["en", "fr", "pt", "es"].forEach((lng, i) => {
  const p = `src/locales/${lng}/common.json`;
  const raw = readFileSync(p, "utf8");
  const json = JSON.parse(raw);
  let added = 0;
  for (const [k, v] of Object.entries(K)) if (!(k in json)) { json[k] = v[i]; added++; }
  writeFileSync(p, JSON.stringify(json, null, 2) + (raw.endsWith("\n") ? "\n" : ""));
  console.log(lng, "added", added);
});
