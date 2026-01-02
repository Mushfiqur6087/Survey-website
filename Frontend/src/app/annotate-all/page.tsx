import AnnotationInterface from '@/components/AnnotationInterface';

export default function AnnotateAll() {
  return (
    <AnnotationInterface
      mode="all"
      sessionPrefix="full-annotation"
      title="Full Trajectory Annotation"
      description="Annotate all 237 trajectory curves by placing knots at important points"
      showTutorial={false}
      showBackButton={true}
      onComplete={(sessionId) => {
        console.log('Completed full annotation with session ID:', sessionId);
      }}
    />
  );
}
