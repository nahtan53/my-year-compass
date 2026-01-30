const LogPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-up">
      <div className="text-6xl mb-4">📝</div>
      <h1 className="text-2xl font-bold mb-2">Daily Logger</h1>
      <p className="text-muted-foreground max-w-sm">
        Utilisez le bouton "Saisie rapide" sur le Dashboard pour enregistrer votre journée.
      </p>
    </div>
  );
};

export default LogPage;
