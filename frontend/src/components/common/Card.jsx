export default function Card({ title, children, className = '', ...rest }) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {title && <h2 className="card__title">{title}</h2>}
      {children}
    </section>
  );
}
