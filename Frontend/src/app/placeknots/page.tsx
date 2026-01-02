import AnnotationInterface from '@/components/AnnotationInterface';

export default function PlaceKnots() {
  return (
    <AnnotationInterface
      mode="random"
      trackCount={10}
      sessionPrefix="survey"
      title="Place Knots - Annotation Tool"
      description="Annotate trajectory curves by placing knots at important points"
      showTutorial={true}
      showBackButton={true}
    />
  );
}
