type FooterColProps = {
  title: string;
  links: { label: string; href: string }[];
};

export function FooterCol({ title, links }: FooterColProps) {
  return (
    <div>
      <h5 className="font-bold mb-5 text-sm">{title}</h5>
      <ul className="space-y-3 text-sm text-white/60">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} className="hover:text-primary-bright transition-colors">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
