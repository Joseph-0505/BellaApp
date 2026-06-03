import "../../styles/layout/header.css";

export default function Header({ title, subtitle, leftContent = null, actions = null, className = "" }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header-top">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
      </div>

      {leftContent ? <div className="page-header-bottom">{leftContent}</div> : null}
    </header>
  );
}
