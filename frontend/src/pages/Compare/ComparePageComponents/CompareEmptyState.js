export default function CompareEmptyState({ navigate }) {
  return (
    <div className="empty-compare">
      <div className="empty-icon">🏠</div>
      <h3 className="empty-compare-h3">No properties selected for comparison</h3>
      <p className="empty-compare-p"> Add properties to compare their features and specifications</p>
      <button onClick={() => navigate("/properties")}>Browse Properties</button>
    </div>
  );
}
