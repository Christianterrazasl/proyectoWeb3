import { PUBLIC_ALL_CATEGORIES } from "../../utils/publicCatalogFlow";

const ALL_CATEGORIES = PUBLIC_ALL_CATEGORIES;

const CompanyCategoryTabs = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  if (!categories.length) {
    return null;
  }

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        className={`lumina-tab cursor-pointer ${
          activeCategory === ALL_CATEGORIES ? "is-active" : ""
        }`}
        onClick={() => onCategoryChange(ALL_CATEGORIES)}
      >
        Todas
      </button>

      {categories.map((category) => (
        <button
          key={category}
          type="button"
          className={`lumina-tab cursor-pointer ${
            activeCategory === category ? "is-active" : ""
          }`}
          onClick={() => onCategoryChange(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export { ALL_CATEGORIES };
export default CompanyCategoryTabs;
