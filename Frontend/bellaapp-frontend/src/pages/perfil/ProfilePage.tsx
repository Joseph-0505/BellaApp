import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Header from "../../components/layout/Header";
import ProfileFormModel from "../../models/ProfileFormModel";
import useAuth from "../../hooks/useAuth";
import { updateCurrentUserProfile } from "../../services/userService";
import type {
  ProfileAuthContextValue,
  ProfileFormFieldName,
} from "../../types/profile";
import { showErrorAlert, showInfoAlert } from "../../utils/alerts";
import "../../styles/profile/profile.css";

function isProfileFormFieldName(value: string): value is ProfileFormFieldName {
  return (
    value === "businessName" ||
    value === "cnpj" ||
    value === "confirmPassword" ||
    value === "cpf" ||
    value === "email" ||
    value === "name" ||
    value === "password"
  );
}

export default function ProfilePage() {
  const { refreshCurrentUser, user } = useAuth() as ProfileAuthContextValue;
  const [profileForm, setProfileForm] = useState<ProfileFormModel>(() => ProfileFormModel.fromUser(user));
  const [loading, setLoading] = useState<boolean>(() => !user);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm(ProfileFormModel.fromUser(user));
      setLoading(false);
      return;
    }

    let active = true;

    refreshCurrentUser()
      .catch(() => {})
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [refreshCurrentUser, user]);

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = event.target;

    if (!isProfileFormFieldName(name)) {
      return;
    }

    setProfileForm((current) => current.withField(name, value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationError = profileForm.validate();
    if (validationError) {
      await showErrorAlert(validationError);
      return;
    }

    setSaving(true);

    try {
      await updateCurrentUserProfile(profileForm.toPayload());
      await refreshCurrentUser();
      setProfileForm((current) => current.clearPasswords());

      await showInfoAlert("Seus dados foram atualizados com sucesso.", {
        title: "Perfil atualizado",
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível atualizar seu perfil.";

      await showErrorAlert(message);
    } finally {
      setSaving(false);
    }
  }

  const { formData } = profileForm;

  return (
    <section className="profile-page">
      <Header
        title="Meu perfil"
        subtitle="Edite seus dados com validação de CPF, senha forte e confirmação antes de salvar."
      />

      <section className="profile-card">
        <div className="profile-card-header">
          <div>
            <h2>Dados da conta</h2>
            <p>O email fica bloqueado para edição. Para salvar, informe uma nova senha válida.</p>
          </div>
        </div>

        {loading ? (
          <p className="profile-feedback">Carregando dados do usuário...</p>
        ) : (
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="profile-grid">
              <div className="profile-field profile-field-full">
                <label htmlFor="profile-name">Nome</label>
                <input
                  id="profile-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Jessica Almeida"
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="profile-field-readonly"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-cpf">CPF</label>
                <input
                  id="profile-cpf"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  maxLength={14}
                  required
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-business-name">Nome do seu negócio</label>
                <input
                  id="profile-business-name"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Ex: Bella Estética"
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-cnpj">CNPJ</label>
                <input
                  id="profile-cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                  maxLength={18}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-password">Nova senha</label>
                <input
                  id="profile-password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Digite a nova senha"
                  required
                />
                <small className="profile-helper">
                  Mínimo de 8 caracteres com letra maiúscula, minúscula, número e símbolo.
                </small>
              </div>

              <div className="profile-field">
                <label htmlFor="profile-confirm-password">Confirmar nova senha</label>
                <input
                  id="profile-confirm-password"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirme a nova senha"
                  required
                />
              </div>
            </div>

            <div className="profile-actions">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        )}
      </section>
    </section>
  );
}
