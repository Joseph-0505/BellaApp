import { Plus, X } from "lucide-react";

function hasService(services, serviceName) {
  return services.some((service) => service.toLowerCase() === serviceName.trim().toLowerCase());
}

export default function OnboardingServicesInput({
  inputValue,
  onAddService,
  onInputChange,
  onRemoveService,
  services,
  suggestions,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onAddService(inputValue);
  }

  return (
    <div className="onboarding-services">
      <form className="onboarding-services-form" onSubmit={handleSubmit}>
        <div className="onboarding-services-input">
          <input
            type="text"
            value={inputValue}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Ex: Limpeza de pele"
            maxLength={60}
          />

          <button
            type="submit"
            className="onboarding-secondary-button"
            disabled={!String(inputValue || "").trim()}
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      </form>

      <div className="onboarding-suggestions" aria-label="Sugestões de serviços">
        {suggestions.map((suggestion) => {
          const selected = hasService(services, suggestion);

          return (
            <button
              key={suggestion}
              type="button"
              className={`onboarding-suggestion-chip ${selected ? "is-selected" : ""}`}
              onClick={() => onAddService(suggestion)}
              disabled={selected}
            >
              {suggestion}
            </button>
          );
        })}
      </div>

      <div className="onboarding-service-list">
        {services.length === 0 ? (
          <div className="onboarding-service-empty">
            Adicione pelo menos um serviço para deixar sua agenda pronta para uso.
          </div>
        ) : (
          services.map((service) => (
            <div key={service} className="onboarding-service-pill">
              <span>{service}</span>
              <button type="button" aria-label={`Remover ${service}`} onClick={() => onRemoveService(service)}>
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
