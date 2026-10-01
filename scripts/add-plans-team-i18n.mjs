// Merge-only: plans, team roles and profile family keys for every locale (en, fr, pt, es).
import { readFileSync, writeFileSync } from "node:fs";
const K = {
  "nav.plans": ["Plans & limits", "Offres et limites", "Planos e limites", "Planes y límites"],
  "profile.family.individual": ["For people", "Pour les particuliers", "Para pessoas", "Para personas"],
  "profile.family.business": ["For businesses", "Pour les entreprises", "Para empresas", "Para empresas"],
  "profile.family.institution": ["For institutions", "Pour les institutions", "Para instituições", "Para instituciones"],
  "plans.title": ["Plans & limits", "Offres et limites", "Planos e limites", "Planes y límites"],
  "plans.subtitle": ["What your account includes, for people and for businesses", "Ce que comprend votre compte, pour les particuliers et les entreprises", "O que a sua conta inclui, para pessoas e empresas", "Lo que incluye su cuenta, para personas y empresas"],
  "plans.pilot": ["Prices are indicative. During the pilot, plan changes are free and billing is not active; team size, webhooks and approval-chain length are enforced from the plan.", "Les prix sont indicatifs. Pendant le pilote, le changement d'offre est gratuit et la facturation n'est pas active ; la taille de l'équipe, les webhooks et la longueur des circuits d'approbation sont appliqués selon l'offre.", "Os preços são indicativos. Durante o piloto, a mudança de plano é gratuita e a faturação não está ativa; a dimensão da equipa, os webhooks e o comprimento das cadeias de aprovação são aplicados conforme o plano.", "Los precios son indicativos. Durante el piloto, el cambio de plan es gratuito y la facturación no está activa; el tamaño del equipo, los webhooks y la longitud de las cadenas de aprobación se aplican según el plan."],
  "plans.forPeople": ["For people", "Pour les particuliers", "Para pessoas", "Para personas"],
  "plans.forBusinesses": ["For businesses and organisations", "Pour les entreprises et organisations", "Para empresas e organizações", "Para empresas y organizaciones"],
  "plans.current": ["Current", "Actuelle", "Atual", "Actual"],
  "plans.unlimited": ["Unlimited", "Illimité", "Ilimitado", "Ilimitado"],
  "plans.onRequest": ["On request", "Sur demande", "Sob consulta", "Bajo petición"],
  "plans.free": ["Free", "Gratuit", "Grátis", "Gratis"],
  "plans.month": ["month", "mois", "mês", "mes"],
  "plans.contact": ["Arranged with your relationship manager.", "Convenu avec votre gestionnaire de relation.", "Acordado com o seu gestor de relação.", "Acordado con su gestor de relación."],
  "plans.choose": ["Switch to {{plan}}", "Passer à {{plan}}", "Mudar para {{plan}}", "Cambiar a {{plan}}"],
  "plans.changed": ["Plan updated", "Offre mise à jour", "Plano atualizado", "Plan actualizado"],
  "team.workspace": ["Workspace", "Espace de travail", "Espaço de trabalho", "Espacio de trabajo"],
  "team.mine": ["My account", "Mon compte", "A minha conta", "Mi cuenta"],
  "team.yourRole": ["Your role here", "Votre rôle ici", "A sua função aqui", "Su rol aquí"],
  "team.title": ["Team and roles", "Équipe et rôles", "Equipa e funções", "Equipo y roles"],
  "team.hint": ["Give colleagues access to this account's modules. Each person acts under their own name, so the four-eyes rule still applies. You are the Owner.", "Donnez à vos collègues l'accès aux modules de ce compte. Chacun agit sous son propre nom, la règle des quatre yeux s'applique donc toujours. Vous êtes le propriétaire.", "Dê aos colegas acesso aos módulos desta conta. Cada pessoa age em seu nome, por isso a regra dos quatro olhos continua a aplicar-se. Você é o proprietário.", "Dé a sus colegas acceso a los módulos de esta cuenta. Cada persona actúa a su nombre, así que la regla de los cuatro ojos sigue aplicándose. Usted es el propietario."],
  "team.none": ["No team members yet.", "Aucun membre pour l'instant.", "Ainda sem membros.", "Aún no hay miembros."],
  "team.added": ["Team member added", "Membre ajouté", "Membro adicionado", "Miembro añadido"],
  "team.suspended": ["suspended", "suspendu", "suspenso", "suspendido"],
  "team.suspend": ["Suspend", "Suspendre", "Suspender", "Suspender"],
  "team.reactivate": ["Reactivate", "Réactiver", "Reativar", "Reactivar"],
  "team.remove": ["Remove", "Retirer", "Remover", "Quitar"],
  "team.removeConfirm": ["Remove this person from the workspace?", "Retirer cette personne de l'espace de travail ?", "Remover esta pessoa do espaço de trabalho?", "¿Quitar a esta persona del espacio de trabajo?"],
  "team.invite": ["Add a PayRus member", "Ajouter un membre PayRus", "Adicionar um membro PayRus", "Añadir un miembro PayRus"],
  "team.identifier": ["Email, @username or phone", "E-mail, @identifiant ou téléphone", "E-mail, @utilizador ou telefone", "Correo, @usuario o teléfono"],
  "team.add": ["Add", "Ajouter", "Adicionar", "Añadir"],
  "team.showRoles": ["Roles and permissions", "Rôles et permissions", "Funções e permissões", "Roles y permisos"],
  "team.hideRoles": ["Hide roles", "Masquer les rôles", "Ocultar funções", "Ocultar roles"],
  "team.system": ["built-in", "intégré", "integrado", "integrado"],
  "team.custom": ["custom", "personnalisé", "personalizado", "personalizado"],
  "team.newRole": ["New custom role", "Nouveau rôle personnalisé", "Nova função personalizada", "Nuevo rol personalizado"],
  "team.roleName": ["Role name", "Nom du rôle", "Nome da função", "Nombre del rol"],
  "team.createRole": ["Create role", "Créer le rôle", "Criar função", "Crear rol"],
  "team.roleSaved": ["Role created", "Rôle créé", "Função criada", "Rol creado"],
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
